export interface CommentAgent {
  uid: number;
  name: string;
  nickname: string | null;
  profileImage: string | null;
}

export interface Comment {
  commentId: number;
  customerId: number;
  orderId: number;
  comment: string;
  commentImage: string | null;
  commentAgentId: number;
  commentAgentName: string;
  commentCreatedDate: string | Date;
  commentUpdatedDate: string | Date | null;
  agent?: CommentAgent;
}
