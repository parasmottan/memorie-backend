import cloudinary from "../config/cloudinary.js";
import Memory from "../models/Memory.js";
import streamifier from "streamifier";

// ------------------ CREATE MEMORY ------------------
export const createMemory = async (req, res) => {
  try {
    const { title, description } = req.body;
    const image = req.files?.image?.[0];
    const audio = req.files?.audio?.[0];
    const video = req.files?.video?.[0];

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    if (!image && !audio && !video) {
      return res.status(400).json({ message: "At least one file (image, audio, or video) is required" });
    }

    // 🧠 Helper to upload any file to cloudinary
    const uploadToCloudinary = (file, resource_type, folder) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type, folder },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
      });
    };

    let imageUrl = null, audioUrl = null, videoUrl = null;

    if (image) {
      const result = await uploadToCloudinary(image, "image", "memories/images");
      imageUrl = result.secure_url;
    }

    if (audio) {
      const result = await uploadToCloudinary(audio, "video", "memories/audio");
      audioUrl = result.secure_url;
    }

    if (video) {
      const result = await uploadToCloudinary(video, "video", "memories/video");
      videoUrl = result.secure_url;
    }

    const memory = await Memory.create({
      title,
      description,
      imageUrl,
      audioUrl,
      videoUrl,
      user: req.user._id,
    });

    res.status(201).json({ message: "Memory created", memory });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ------------------ GET ALL MEMORIES ------------------
export const getAllMemories = async (req, res) => {
  try {
    const memories = await Memory.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ memories });
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ message: "Failed to fetch memories", error: err.message });
  }
};

// ------------------ DELETE MEMORY ------------------
export const deleteMemory = async (req, res) => {
  try {
    const memoryId = req.params.id;
    const memory = await Memory.findById(memoryId);

    if (!memory) {
      return res.status(404).json({ message: "Memory not found" });
    }

    const publicIds = [];

    if (memory.imageUrl?.includes("cloudinary") && memory.image?.public_id)
      publicIds.push(memory.image.public_id);
    if (memory.audioUrl?.includes("cloudinary") && memory.audio?.public_id)
      publicIds.push(memory.audio.public_id);
    if (memory.videoUrl?.includes("cloudinary") && memory.video?.public_id)
      publicIds.push(memory.video.public_id);

    for (const publicId of publicIds) {
      await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
    }

    await Memory.findByIdAndDelete(memoryId);

    res.status(200).json({ message: "Memory deleted successfully" });
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ message: "Server error while deleting memory" });
  }
};

export const getSingleMemory = async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id);
    if (!memory) {
      return res.status(404).json({ message: "Memory not found" });
    }
    res.status(200).json(memory);
  } catch (err) {
    console.error("Error fetching memory:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};