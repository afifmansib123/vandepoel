"use client";

import React, { useEffect } from "react";
import { Amplify } from "aws-amplify";
import {
  Authenticator,
  Heading,
  Radio,
  RadioGroupField,
  useAuthenticator,
  View,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useRouter, usePathname } from "next/navigation";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
      userPoolClientId:
        process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID!,
    },
  },
});

const components = {
  Header() { 
    return (
      <View className="mt-4 mb-7">
        <Heading level={3} className="!text-2xl !font-bold">
          AssetX
          <span className="text-secondary-500 font-light hover:!text-primary-300">
            Token
          </span>
        </Heading>
        <p className="text-muted-foreground mt-2">
          <span className="font-bold">Welcome!</span> Please sign in to continue
        </p>
      </View>
    );
  },
  SignIn: { 
    Footer() {
      const { toSignUp } = useAuthenticator();
      return (
        <View className="text-center mt-4">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              onClick={toSignUp}
              className="text-primary hover:underline bg-transparent border-none p-0"
            >
              Sign up here
            </button>
          </p>
        </View>
      );
    },
  },
  SignUp: {
    FormFields() {
      const { validationErrors } = useAuthenticator();

      return (
        <>
          <Authenticator.SignUp.FormFields /> 
          {/* --- MODIFICATION START --- */}
          <RadioGroupField
            legend="Role" // Kept original legend
            name="custom:role" // MUST match your Cognito custom attribute
            errorMessage={validationErrors?.["custom:role"]}
            hasError={!!validationErrors?.["custom:role"]}
            isRequired // Kept original isRequired
          >
            <Radio value="tenant">Tenant</Radio>
            <Radio value="manager">Agent/Co-agents</Radio>
            <Radio value="landlord">Landlord</Radio> {/* ADDED Landlord */}
            <Radio value="buyer">Buyer</Radio>     {/* ADDED Buyer */}
            <Radio value="superadmin">SuperAdmin</Radio>  
          </RadioGroupField>
        </>
      );
    },

    Footer() { // Original SignUp Footer
      const { toSignIn } = useAuthenticator();
      return (
        <View className="text-center mt-4">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={toSignIn}
              className="text-primary hover:underline bg-transparent border-none p-0"
            >
              Sign in
            </button>
          </p>
        </View>
      );
    },
  },
};

const formFields = { // Original formFields
  signIn: {
    username: {
      placeholder: "Enter your email",
      label: "Email",
      isRequired: true,
    },
    password: {
      placeholder: "Enter your password",
      label: "Password",
      isRequired: true,
    },
  },
  signUp: {
    username: {
      order: 1,
      placeholder: "Choose a username",
      label: "Username",
      isRequired: true,
    },
    email: {
      order: 2,
      placeholder: "Enter your email address",
      label: "Email",
      isRequired: true,
    },
    password: {
      order: 3,
      placeholder: "Create a password",
      label: "Password",
      isRequired: true,
    },
    confirm_password: {
      order: 4,
      placeholder: "Confirm your password",
      label: "Confirm Password",
      isRequired: true,
    },
  },
};

const Auth = ({ children }: { children: React.ReactNode }) => {
  const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]); // Added authStatus for more robust checks
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === "/signin" || pathname === "/signup"; // Original check, slightly simplified from regex

  const dashboardPrefixes = ["/manager", "/tenants", "/landlords", "/buyers", "/superadmin"]; // ADDED landlord and buyer prefixes
  const isDashboardPage = dashboardPrefixes.some(prefix => pathname.startsWith(prefix));

  useEffect(() => {
    if (authStatus === 'authenticated' && isAuthPage) {
      router.replace("/"); // Using replace to avoid adding to history stack
    }
  }, [authStatus, isAuthPage, router]);  

  // Allow access to public pages without authentication
  if (!isAuthPage && !isDashboardPage) {
    return <>{children}</>;
  }

  return (
    <div className="h-full"> {/* Original wrapper div */}
      <Authenticator
        initialState={pathname.includes("signup") ? "signUp" : "signIn"}
        components={components}
        formFields={formFields}
      >
        {children}
      </Authenticator>
    </div>
  );
};

export default Auth;