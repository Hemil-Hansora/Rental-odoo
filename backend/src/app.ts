import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorMiddleware } from "./middlewares/index";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import userRouter from "./routes/user.routes";
import productRouter from "./routes/product.routes";
import categoryRouter from "./routes/category.routes";
import orderRouter from "./routes/order.routes";
import quotationRouter from "./routes/quotation.routes";
import discountRouter from "./routes/discount.routes";
import invoiceRouter from "./routes/invoice.routes";
import logisticsRouter from "./routes/logistics.routes";
import paymentRouter from "./routes/payment.routes";
import notificationRouter from "./routes/notification.routes";
import priceListRouter from "./routes/priceList.routes";
import timeDependentPriceRule from "./routes/timeDependentPriceRule.routes";
import reservationRouter from "./routes/reservation.routes";


app.use("/api/v1/user", userRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/quotation", quotationRouter);
app.use("/api/v1/discount", discountRouter);
app.use("/api/v1/invoice", invoiceRouter);
app.use("/api/v1/logistics", logisticsRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/priceList", priceListRouter);
app.use("/api/v1/timeDependentPriceRule", timeDependentPriceRule);
app.use("/api/v1/reservation", reservationRouter);




app.use(errorMiddleware);
export default app ;