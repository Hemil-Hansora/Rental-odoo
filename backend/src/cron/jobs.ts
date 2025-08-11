import cron from 'node-cron';
import { Order } from '../models/order.model';
import { sendEmail } from '../utils/mailer';
import { sendNotification } from '../controllers/notification.controller';

export const setupCronJobs = () => {
    console.log("🕒 Cron jobs setup initiated.");

    // Schedule a task to run every hour to check for overdue items.
    // Cron pattern: 'minute hour day-of-month month day-of-week'
    cron.schedule('0 * * * *', async () => {
        console.log('⏰ Running hourly check for overdue orders...');
        try {
            const now = new Date();
            
            // Find orders that are currently active, past their return date,
            // and have not been notified yet.
            const overdueOrders = await Order.find({
                status: { $in: ['picked_up', 'in_use'] },
                'return.scheduledAt': { $lt: now },
                isOverdueNotified: false
            }).populate('customer', 'name email');

            if (overdueOrders.length === 0) {
                console.log('✅ No overdue orders found.');
                return;
            }

            for (const order of overdueOrders) {
                // 1. Update the order status
                order.status = 'overdue';
                order.isOverdueNotified = true;
                await order.save();

                // 2. Send an email notification
                const customer = order.customer as any;
                await sendEmail({
                    to: customer.email,
                    subject: `Your Rental Order is Overdue!`,
                    html: `<p>Hi ${customer.name}, please note that your order #${order._id.toString().slice(-6)} is now overdue. Please return the items as soon as possible to avoid late fees.</p>`
                });
                
                // 3. Send a WebSocket notification
                await sendNotification(
                    customer._id.toString(),
                    'order_overdue',
                    {
                        orderId: order._id,
                        message: `Your order is overdue. Please return the items.`
                    }
                );
                
                console.log(`- Notified user ${customer.email} for overdue order ${order._id}`);
            }

        } catch (error) {
            console.error("Error in overdue check cron job:", error);
        }
    });

    // You can schedule other jobs here...
};