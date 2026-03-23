import bcrypt from 'bcryptjs';
import * as User from '../models/User.js';

export const getAll = async (req, res) => {
  const users = await User.findAll();
  return res.json({ success: true, data: users });
};

export const getById = async (req, res) => {
  const user = await User.findById(parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  return res.json({ success: true, data: user });
};

export const create = async (req, res) => {
  let { name, email, password, role } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }

  const effectiveRole = role || 'visitor';

  if (effectiveRole === 'admin') {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required for admin users' });
    }
  } else {
    if (!email) email = `visitor_${Date.now()}@noemail.local`;
    if (!password) password = 'no-login';
  }

  const existing = await User.findByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already in use' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = await User.create({ name, email, password: hashedPassword, role: effectiveRole });
  return res.status(201).json({ success: true, data: user });
};

export const update = async (req, res) => {
  const id = parseInt(req.params.id);
  let { name, email, password, role } = req.body;

  const existing = await User.findById(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const effectiveRole = role || existing.role;

  if (effectiveRole === 'admin') {
    if (email === '' || (email === undefined && !existing.email)) {
      return res.status(400).json({ success: false, message: 'Email is required for admin users' });
    }
  }

  if (email && email !== existing.email) {
    const emailUser = await User.findByEmail(email);
    if (emailUser) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }
  }

  const updates = { name, role };

  if (effectiveRole === 'admin') {
    updates.email = email !== undefined ? email : existing.email;
  } else {
    if (email) updates.email = email;
  }

  if (password) {
    updates.password = bcrypt.hashSync(password, 10);
  }

  const user = await User.update(id, updates);
  return res.json({ success: true, data: user });
};

export const deleteUser = async (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = await User.deleteUser(id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  return res.json({ success: true, data: { message: 'User deleted' } });
};

export const getAccount = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  return res.json({ success: true, data: user });
};

export const updateAccount = async (req, res) => {
  const id = req.user.id;
  const { name, email, current_password, new_password } = req.body;

  const userWithPwd = await User.findByIdWithPassword(id);
  if (!userWithPwd) return res.status(404).json({ success: false, message: 'User not found' });

  const changingEmail = email && email !== userWithPwd.email;
  const changingPassword = !!new_password;

  if ((changingEmail || changingPassword) && !current_password) {
    return res.status(400).json({ success: false, message: 'Mot de passe actuel requis pour modifier email ou mot de passe' });
  }

  if (current_password) {
    const valid = bcrypt.compareSync(current_password, userWithPwd.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Mot de passe actuel incorrect' });
  }

  if (changingEmail) {
    const existing = await User.findByEmail(email);
    if (existing && existing.id !== id) {
      return res.status(409).json({ success: false, message: 'Email déjà utilisé' });
    }
  }

  const updates = {};
  if (name) updates.name = name;
  if (changingEmail) updates.email = email;
  if (changingPassword) updates.password = bcrypt.hashSync(new_password, 10);

  const updated = await User.update(id, updates);
  return res.json({ success: true, data: updated });
};
