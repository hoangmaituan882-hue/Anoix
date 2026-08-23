export interface AdminUser {
  uid: string;
  username: string;
  email: string;
  nickname: string;
  gender: string;
  avatarUrl: string;
  country: string;
  province: string;
  city: string;
  isAnonymous: boolean;
  disabled: boolean;
  hasPassword: boolean;
  createTime: string;
  updateTime: string;
  role: 'user' | 'admin';
}
