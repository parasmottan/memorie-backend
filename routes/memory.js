import express from "express";
import upload from "../middlewares/upload.js";
import auth from "../middlewares/authMiddleware.js";
import { createMemory, getAllMemories, deleteMemory, getSingleMemory } from "../controllers/memoryController.js";

const router = express.Router();

router.post("/create", auth, upload, createMemory);
router.get("/all", auth, getAllMemories);
router.delete("/:id", auth, deleteMemory); // ✅ Auth added
router.get('/:id', auth, getSingleMemory);


export default router;
