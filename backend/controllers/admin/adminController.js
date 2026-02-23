import crypto from "crypto";
import bcrypt from "bcrypt";
import { User, Reset_Token, Gym } from "../../models/index.js";
import { transporter } from "../../config/mail.js";
import { Op } from "sequelize";
//netestat?
export const controller = {
  createTrainer: async (req, res) => {
    try {
      const requester = req.user;
      if (requester.role !== "gym_admin") {
        return res.status(403).send("Only gym admin can create trainers");
      }
      const { gym_id,email, first_name, last_name, phone } = req.body;
      if (!gym_id||!email || !first_name || !last_name || !phone) {
        return res.status(400).send("Missing required fields");
      }

      const gym=await Gym.findOne({where:{gym_id, admin_user_id:requester.user_id}});
      if(!gym){
        return res.status(403).send("You do not manage this gym");
      }
      const existing = await User.findOne({
        where: {
          [Op.or]: [{ email }, { phone }],
        },
      });
      if (existing) {
        if (existing.email === email) {
          return res.status(409).send("Email already used");
        }

        if (existing.phone === phone) {
          return res.status(409).send("Phone number already used");
        }
      }
      const tempPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const trainer = await User.create({
        email,
        password: hashedPassword,
        first_name,
        last_name,
        role: "trainer",
        phone,
        gym_id: gym_id,
        registration_date: new Date(),
        is_active: false,
      });
      const token = crypto.randomBytes(32).toString("hex");
      const token_hash = await bcrypt.hash(token, 10);
      await Reset_Token.create({
        user_id: trainer.user_id,
        token_hash,
        expires_at: new Date(Date.now() + 1000 * 60 * 60), //intr o ora
      });
      const resetLink = `${process.env.CLIENT_URL}/set-password?token=${token}&userId=${trainer.user_id}`;
      await transporter.sendMail({
        to: trainer.email,
        subject: "Set your password - Fitness App",
        html: `
                     <p>Hello ${trainer.first_name},</p>
          <p>Your trainer account has been created.</p>
          <p>Please set your password by clicking the link below:</p>
          <a href="${resetLink}">Set Password</a>
          <p>This link expires in 1 hour.</p>
                    `,
      });
      return res.status(201).send("Trainer created and email sent");
    } catch (err) {
      return res.status(500).send("Error creating trainer: " + err);
    }
  },
  createGym: async(req,res)=>{
    try{
 
      const {name,address,max_capacity,opening_time,closing_time}=req.body;
      if(!name|| !address||!max_capacity||!opening_time||!closing_time){
        return res.status(400).send("Missing required fields");
      }
      const gym=await Gym.create({
        name,
        address,
        max_capacity,
        opening_time,
        closing_time,
        admin_user_id:req.user.user_id
      })
      return res.status(201).json(gym);
    }catch(err){
      return res.status(500).send("Error while creating gym: "+err);
    }
  },
  getMyGyms:async(req,res)=>{
    try{
      const gyms=await Gym.findAll(
        {
          where:{admin_user_id:req.user.user_id}
        }
      );
      return res.status(200).json(gyms);
    }catch(err){
      return res.status(500).send("Error: "+err);
    }
  }
};
