"use server";

import { signIn } from "@/auth";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import ratelimit from "@/lib/rateLimit";
import { redirect } from "next/navigation";

export const signInWithCredentials = async (params: Pick<AuthCredentials, "email" | "password">) => {
  const { email, password } = params;
  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) return redirect("/too-fast");
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      return {
        success: false,
        error: result.error as string,
      };
    }

    return {
      success: true,
      message: "User signed in successfully",
    };
  } catch (error) {
    console.log(error, "Signin error");
    return {
      success: false,
      error: "Signin error",
    };
  }
};
export const signUp = async (params: AuthCredentials) => {
  const { fullName, email, password, universityId, universityCard } = params;
  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) return redirect("/too-fast");
  // check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existingUser.length > 0) {
    return { success: false, message: "User already exists" };
  }
  // Hash the password
  const hashedPassword = await hash(password, 10);
  // Create the user
  try {
    await db.insert(users).values({
      fullName,
      email,
      password: hashedPassword,
      universityId,
      universityCard,
    });
    await signInWithCredentials({ email, password });
    return {
      success: true,
      message: "User created successfully",
    };
  } catch (error) {
    console.log(error, "SignUp Error");
    return {
      success: false,
      error: "Signup error",
    };
  }
};
