import mongoose from "mongoose";

const ResourceSchema = new mongoose.Schema({
  type:         { type: String, required: true },
  title:        { type: String, required: true },
  description:  { type: String },
  url:          { type: String, required: true },
  category:     { type: String },
  thumbnailUrl: { type: String },
}, { timestamps: true });

// Exportación por defecto:
export default mongoose.model("Resource", ResourceSchema);
