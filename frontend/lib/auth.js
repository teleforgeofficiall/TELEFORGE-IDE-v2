import api from './api';

export async function register(email, username, password) {
  const res = await api.post('/auth/register', { email, username, password });
  return res.data;
}

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function getMe() {
  const res = await api.get('/user/me');
  return res.data;
}

export async function updateApiKey(apiKey) {
  const res = await api.put('/user/api-key', { apiKey });
  return res.data;
}

export async function getCredits() {
  const res = await api.get('/user/credits');
  return res.data;
}

export async function sendChatMessage(message, model, sessionId = null) {
  const res = await api.post('/ai/chat', { message, model, sessionId });
  return res.data;
}

export async function getModels() {
  const res = await api.get('/ai/models');
  return res.data;
}

export async function getSessions() {
  const res = await api.get('/ai/sessions');
  return res.data;
}

export async function getSessionMessages(sessionId) {
  const res = await api.get(`/ai/sessions/${sessionId}/messages`);
  return res.data;
}

export async function getFiles() {
  const res = await api.get('/files');
  return res.data;
}

export async function writeFile(path, content) {
  const res = await api.post('/files/write', { path, content });
  return res.data;
}

export async function readFile(path) {
  const res = await api.get(`/files/read`, { params: { path } });
  return res.data;
}

export async function deleteFile(path) {
  const res = await api.delete('/files/delete', { params: { path } });
  return res.data;
}

export async function createFolder(path) {
  const res = await api.post('/files/mkdir', { path });
  return res.data;
}

export async function createSubscription() {
  const res = await api.post('/payment/create-subscription');
  return res.data;
}

export async function verifyPayment(paymentId, subscriptionId, signature) {
  const res = await api.post('/payment/verify', {
    razorpay_payment_id: paymentId,
    razorpay_subscription_id: subscriptionId,
    razorpay_signature: signature,
  });
  return res.data;
}
