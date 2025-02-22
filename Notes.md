## Reusable Form - I
- create `(auth)/sign-in/page.tsx` and `(auth)/sign-up/page.tsx` files
```tsx
"use client"
export default const page = () => {
  return <AuthForm .... />
}
```
- Now in that custom component `AuthForm` we can pass props to identify the form type and other properties
`<AuthForm
type="sign-in"
schema={signInSchema}
defaultValues={{email:"", password:""}}
onSubmit={()=> {}}
/>`
- Same for the sign-up page also
- Now we will create the AuthForm component, that will have the form and the form fields
- refer shadcn ui form
```tsx
// #2 Now need to specify props types
// Generic type (can be anything) -> FieldValues type from react-hook-form, representing any object that can be used as form values.
interface Props<T extends FieldValues> {
  // schema: ZodType<T> -> ZodType is a type from the zod library, which is a schema for validating data.
  schema: ZodType<T>;
  // defaultValues: T -> default values for the form fields
  defaultValues: T;
  onSubmit: (data: T) => Promise<{success:boolean; error?:string}>
  type: "SIGN_UP" | "SIGN_IN";
}

// #1 destructuring the props
const AuthForm = <T extends FieldValues>({type, schema, defaultValues, onSubmit}: Props<T>) => {
  // simple checking if the prop type is sign-in or sign-up
  const isSignedIn = type === "sign-in";
  // useForm hook from react-hook-form
  // UseFormReturn<T> -> T is the type of the form values
  const form: UseFormReturn<T> = useForm({
    resolver: zodResolver(schema),
    // Default is the type from react-hook-form
    defaultValues: defaultValues as DefaultValues<T>
  })
  // SubmitHandler<T> type from react-hook-form
  const handleSubmit: SubmitHandler<T> = async (data) => {}
  return (
    <div>
      ...
      <p className="text-light-100">
        {isSignedIn
          ? "Access the vast ..."
          : "Please complete all fields.."}
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {/* Now each form field defines each of the item in the form, but I want to make it dynamic depending on the sign-up or sign-in */}
          {/* So I'll loop through the default values and render each one as a FormField */}
          {Object.keys(defaultValues).map((field)=> (
            <FormField key={field}
              control={form.control}
              name={field as Path<T>} // Path<T> is a type from react-hook-form
              render={({field}) => (
              <FormItem>
                <FormLabel>{field.name}</FormLabel>
                <FormControl>
                  {field.name === "universityCard" ? (

                  ):(

                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
              )}
            />
          ))}

        </form>

      </Form>

    </div>
  )
}

```

## ImageKit - I
---
-create .env -> put imagekit url endpoint, public key, private key
- create `lib/config.ts`
```ts
// so to access the endpount or key whatever we'll use the config object
// optional
const config = {
  env: {
    apiEndpoint: process.env.NEXT_PUBLIC_API_ENDPOINT!,
    imagekit: {
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
      urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    },
  },
};
export default config;
```
- Go to documentation and installing for NextJS
- IKImage -> image rendering, IKVideo -> video resizing, IKUpload->file uploading,
- create `components/FileUpload.tsx`


## Neon Postgres
---
- Now let's configure our serverless posgres db. Why?
- Follow the documentation
- Create schema
- Use drizzle studio to visualize and add data
- Example select query
```tsx
...
const Home = async () => {
  const res = await db.select().from(users) // select all users from db users
}
```

## AuthJS
---
- install and we'll use drizzle adapter for our app : used to store our data for user accounts and sessions
- With these adapters we have automatic db handling and type safety ideal for standarized and low maintenance approach
- But in our case only email, pass no soacial so w/o adapter is preferrable.
- `npm i next-auth@beta`
- Create the `./auth.ts` to set up our next-auth service
```ts
import NextAuth, { User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db/drizzle";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        // user is one and [{}] array of object type, so user[0] is needed to access values
        const user = await db.select().from(users).where(eq(users.email, credentials.email.toString())).limit(1);

        if (user.length === 0) return null;

        const isPasswordValid = await compare(credentials.password.toString(), user[0].password);
        if (!isPasswordValid) return null;

        return {
          id: user[0].id.toString(),
          email: user[0].email,
          name: user[0].fullName,
        } as User; // next-auth User type
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
});

```
- I don't want to query every time to the db, so we'll pass important information inside the token (however it'll increase the payload size) and can extract accordingly.
- Now NextAuth User type has id, name, email, image all optionally. If my auth has other vars, we need to define types
  - The `next-auth.d.ts` file is used to extend and customise the types provided by the next-auth package in TS
  ```ts
  // src/types/next-auth.d.ts
  import "next-auth";
  // declaring and modifying the module so that it gets to know about the custom datatypes
  declare module "next-auth" {
  // key user : values
  // if defaultSession add user key, even if there is not value
    interface Session {
      user: {
        _id?: string;
        isVerified?: boolean;
        isAcceptingMessages?: boolean;
        username?: string;
      } & DefaultSession["user"];
    }

    interface User {
      _id?: string;
      isVerified?: boolean;
      isAcceptingMessages?: boolean;
      username?: string;
    }
  }
  // another way to declare and change
  declare module "next-auth/jwt" {
    interface JWT {
      _id?: string;
      isVerified?: boolean;
      isAcceptingMessages?: boolean;
      username?: string;
    }
  }
  ```
  - Do this if necessary
- Create `api/auth/[...nextauth]/route.ts` and fill (documentation)
- Same for middleware as well paste from doc or you create your own middleware as well (exmaple)
```ts
// This is the code for Next-Auth middleware, more or less same code will be there
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
export { default } from "next-auth/middleware";

// In which of the routes, you want your middleware to run : exmaple paths
export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up", "/", "/verify/:path*"],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const url = request.nextUrl;

  // Redirect to dashboard if the user is already authenticated
  // and trying to access sign-in, sign-up, or home page
  if (
    token &&
    (url.pathname.startsWith("/sign-in") ||
      url.pathname.startsWith("/sign-up") ||
      url.pathname.startsWith("/verify") ||
      url.pathname === "/")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!token && url.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}
```
- Now we'll create **server actions** for form actions (in this case auth) `lib/actions/auth.ts`
- Basically here we'll write the actual controller logic for signup and signin
```ts
"user server"
import {db} from "@db/drizzle"
import {users} from "@db/schema"
import {dq} from "drizzle-orm"
import {hash} from "bcryptjs"
import {signIn} from "@/auth" // auth.ts file

interface AuthCredentials {
  fullName: string;
  email: string;
  password: string;
  universityId: number;
  universityCard: string;
}
export const signUp = async (params: AuthCredentials) => {
  // extract
  cost {fullName, ....} = params;
  // check for existing user -> this will be an array of object (VVI)
  const existingUser = await db.select().from(users).where(eq(email, users.emil)).limit(1)
  // as array so check length
  if (exitingUser.length===0) -> error

  // hash the password
  const hashedPassword = await hash(password, 10)
  // create the user

  try{
    await db.insert(users).values({
      ...
    })
    return {...}
  } catch(error) {
    ...
  }
}
export const signInWithCredentials = async (params: Pick<AuthCredentials, "emai"| "password">) => {
  const {email, password} = params
  // Now we need o check the fields and sign the user in -> Nextauth prvides signIn functon
  try {
    const res = await signIn("credentials", {
      email, password, redirect: false // back button won't go to sign in if i signed in
    })
    if (res?.error) return {...}
    return {...}
  }catch(error) {
    ...
  }
}
```
- Now remember the signup and signin forms I have created using AuthForm component. Complete the onSubmit event there
```tsx
... onSubmit={signUp} ...
```
- Now obviously need to change **handleSubmit** function inAuthForm
```tsx
const router = useRouter(); // from next-navigation

const handleSubmit: SubmitHandler<T> = async (data) => {
  const result = await onSubmit(data);
  if (result.success) {
    ...
    router.push("/"); // Redirect to / after successful sign-in or sign-up
  } else {
    toast({
      title: `Error ${isSignedIn ? "signing in" : "signing up"}`,
      description: result.error ?? "An error occurred.",
      variant: "destructive",
    });
  }
};
```
- Now wrap our app layout with SessionProvider
```ts
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

export const async function RootLayout () {
...
  const session = await auth();
  return (
    <html lang="en" suppressHydrationWarning>
      <SessionProvider session={session}>
        <body>
          ...
        </body>
      </SessionProvider>
    </html>
  );
}
```
- Now to access session in components/pages
```ts
// Here I am editing the layout file of (auth) and (root) and setting up redirect
// No need to do if custom middleware is set up
...
const session = await auth();
if (session) redirect("/");
```
- server action inside a component
```tsx
```
## Upstash Redis
### Rate limiting
- create redis instance - copy url and token - create env for that
- install ratelimit - Add ratelimit to your endpoint
- create `lib/ratelimit.ts`
```ts
import redis from "@/db/redis";
import { Ratelimit } from "@upstash/ratelimit";
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(5, "1m"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});
export default ratelimit;
```
- create the `db/redis.ts`
```ts
import config from "@/lib/config";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: config.env.upstash.redisUrl,
  token: config.env.upstash.redisToken,
});
export default redis;
```
- Now let's do rate limiting in your apis, -> server actions
```ts
...
const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
const { success } = await ratelimit.limit(ip);
if (!success) return redirect("/too-fast"); // create this inside app
...
```
### User onboarding flow (upstash) - email
- add qstash url and token to env and config
