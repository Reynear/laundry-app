import { Hono } from 'hono';
console.log('Hono is:', Hono);
console.log('Type of Hono:', typeof Hono);
try {
    const app = new Hono();
    console.log('App created successfully');
} catch (e) {
    console.error('Error creating app:', e);
}
