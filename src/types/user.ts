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
  /** 顺序用户编号（001 / 002 / …），管理员创建时分配。 */
  userNo: string | null;
  /** 注册时间（写入 user_roles 的时间戳）。 */
  registeredAt: string | null;
}
