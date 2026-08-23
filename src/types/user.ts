export interface AdminUser {
  uid: string;
  username: string;
  email: string;
  nickname: string;
  isAnonymous: boolean;
  disabled: boolean;
  hasPassword: boolean;
  createTime: string;
  updateTime: string;
  role: 'user' | 'admin';
}
