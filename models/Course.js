import mongoose from "mongoose";

const Schema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please enter course title"],
    minLength: [4, "Title must be at least 4 characters"],
    maxLength: [80, "Title can't exceed 80 charaters"],
  },
  description: {
    type: String,
    required: [true, "Please enter course title"],
    minLength: [20, "Description must be at least 20 characters"],
  },
  lectures: [
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      videos: {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    },
  ],
  poster: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  views: {
    type: Number,
    default: 0,
  },
  numOfVideos: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Course = mongoose.model("Course", Schema);
