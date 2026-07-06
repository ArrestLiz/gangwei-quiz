export const accounts = [
  { id: 'user', name: '普通用户', role: 'user' },
  { id: 'admin', name: '管理员', role: 'admin' },
]

export function findAccount(id) {
  return accounts.find(a => a.id === id)
}
