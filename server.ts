import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON with larger payload limits since we send base64 files
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route to Send Email
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, bodyText, excelBase64, fileName } = req.body;

    if (!to) {
      return res.status(400).json({ error: "El destinatario es requerido" });
    }

    try {
      let transporter;

      // Check if real SMTP credentials are provided in the environment
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log("Configuring real SMTP transporter...");
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        // Fallback to auto-generated Ethereal SMTP service for a fully working mock inbox preview!
        console.log("Configuring Ethereal SMTP fallback transporter...");
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      }

      const mailOptions: any = {
        from: process.env.SMTP_FROM || '"SIMCO - Liverpool" <simco-no-reply@liverpool.com.mx>',
        to,
        subject: subject || "Recepción de Contenedores - SIMCO",
        text: bodyText || "Comparto el informe conciliado de la recepción de contenedores.",
      };

      if (excelBase64) {
        mailOptions.attachments = [
          {
            filename: fileName || `Reporte_Auditoria_Liverpool_${new Date().toISOString().split('T')[0]}.xlsx`,
            content: excelBase64,
            encoding: "base64",
          }
        ];
      }

      const info = await transporter.sendMail(mailOptions);
      console.log("Message sent: %s", info.messageId);

      // If Ethereal was used, get the preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);

      return res.json({
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || null,
        usingFallback: !process.env.SMTP_HOST
      });

    } catch (error: any) {
      console.error("Error sending email:", error);
      return res.status(500).json({
        error: "Error al enviar el correo",
        details: error.message
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
