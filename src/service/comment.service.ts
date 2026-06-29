import * as commentRepository from '../repository/comment.repository';
import fs from 'fs';
import path from 'path';

export async function getCommentsForOrder(orderId: number) {
  return commentRepository.findByOrderId(orderId);
}

export async function handleUpload(file: File): Promise<string> {
  // Validate that the file is an image
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  // Create directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'comments');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Generate a unique filename
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const extension = path.extname(file.name) || '.png';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${extension}`;
  const filePath = path.join(uploadDir, fileName);

  // Write file
  await fs.promises.writeFile(filePath, buffer);

  // Return the public URL path
  return `/uploads/comments/${fileName}`;
}

export async function createComment(data: {
  customerId: number;
  orderId: number;
  comment: string;
  commentImage?: string | null;
  commentAgentId: number;
  commentAgentName: string;
}) {
  if (!data.comment || data.comment.trim() === '') {
    throw new Error('Comment text cannot be empty');
  }

  return commentRepository.create({
    customerId: data.customerId,
    orderId: data.orderId,
    comment: data.comment,
    commentImage: data.commentImage || null,
    commentAgentId: data.commentAgentId,
    commentAgentName: data.commentAgentName,
  });
}
