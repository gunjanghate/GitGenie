
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, email, reason, message } = await request.json();

    // TODO: Implement actual email sending logic here.
    // For example, using a service like Resend, SendGrid, or Nodemailer.
    console.log("Received contact form submission:");
    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Reason:", reason);
    console.log("Message:", message);

    // Simulate a successful API call
    return NextResponse.json({ message: "Form submitted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json({ message: "An error occurred while submitting the form." }, { status: 500 });
  }
}
