/**
 * User management helpers: CloudBase user → local shape, sequential user_no.
 */
import { pgGet, pgWrite } from './db.js';
import { nextUserNoFromList } from './pure.js';

export const mapUser = (u, roleMap) => {
  const r = roleMap.get(u.UUId);
  return {
    uid: u.UUId,
    username: u.UserName || '',
    email: u.Email || '',
    nickname: u.NickName || '',
    gender: u.Gender || '',
    avatarUrl: u.AvatarUrl || '',
    country: u.Country || '',
    province: u.Province || '',
    city: u.City || '',
    isAnonymous: Boolean(u.IsAnonymous),
    disabled: Boolean(u.IsDisabled),
    hasPassword: Boolean(u.HasPassword),
    createTime: u.CreateTime || '',
    updateTime: u.UpdateTime || '',
    role: r?.role === 'admin' ? 'admin' : 'user',
    userNo: r?.user_no || null,
    registeredAt: r?.registered_at || null,
  };
};

export async function nextUserNo() {
  const rows = await pgGet('/user_roles?select=user_no');
  return nextUserNoFromList((rows || []).map((r) => r.user_no));
}

/** Insert a user_roles row, retrying on user_no UNIQUE collision (race-safe). */
export async function insertUserRole(uid, role, username) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const userNo = await nextUserNo();
    const [status] = await pgWrite('POST', '/user_roles', {
      uid,
      role,
      username: username ?? null,
      user_no: userNo,
      registered_at: new Date().toISOString(),
    });
    if (status < 400) return true;
    if (status !== 409) return false; // non-duplicate error → give up
    // 409 → duplicate uid (already has a row) OR duplicate user_no (race)
    const exists = await pgGet(`/user_roles?uid=eq.${encodeURIComponent(uid)}&select=uid`);
    if (exists?.length) return true; // uid already registered → done
    // else user_no collision → retry with the next number
  }
  return false;
}