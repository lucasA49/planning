import bcrypt from 'bcryptjs';
import * as User from '../models/User.js';

export const getAll = (req, res) => {
  const users = User.findAll();
  return res.json({ success: true, data: users });
};

export const getById = (req, res) => {
  const user = User.findById(parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  return res.json({ success: true, data: user });
};

export const create = (req, res) => {
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
    // visitor role: email and password are optional
    if (!email) {
      email = `visitor_${Date.now()}@noemail.local`;
    }
    if (!password) {
      password = 'no-login';
    }
  }

  const existing = User.findByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already in use' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = User.create({ name, email, password: hashedPassword, role: effectiveRole });
  return res.status(201).json({ success: true, data: user });
};

export const update = (req, res) => {
  const id = parseInt(req.params.id);
  let { name, email, password, role } = req.body;

  const existing = User.findById(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const effectiveRole = role || existing.role;

  if (effectiveRole === 'admin') {
    // Admin must have email
    if (email === '' || (email === undefined && !existing.email)) {
      return res.status(400).json({ success: false, message: 'Email is required for admin users' });
    }
  }

  if (email && email !== existing.email) {
    const emailUser = User.findByEmail(email);
    if (emailUser) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }
  }

  const updates = { name, role };

  if (effectiveRole === 'admin') {
    updates.email = email !== undefined ? email : existing.email;
  } else {
    // visitor: only update email if explicitly provided and not empty
    if (email) {
      updates.email = email;
    }
  }

  if (password) {
    updates.password = bcrypt.hashSync(password, 10);
  }

  const user = User.update(id, updates);
  return res.json({ success: true, data: user });
};

export const deleteUser = (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = User.deleteUser(id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  return res.json({ success: true, data: { message: 'User deleted' } });
};
