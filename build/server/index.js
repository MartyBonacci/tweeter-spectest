import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, useLocation, Link, Form, UNSAFE_withComponentProps, useLoaderData, Meta, Links, Outlet, ScrollRestoration, Scripts, UNSAFE_withErrorBoundaryProps, useActionData, useNavigation, redirect, useFetcher, useNavigate } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { useState, useMemo, useEffect } from "react";
import { Modal, Button } from "flowbite-react";
import { z } from "zod";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    let timeoutId = setTimeout(
      () => abort(),
      streamTimeout + 1e3
    );
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = void 0;
              callback();
            }
          });
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          pipe(body);
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const stylesheetUrl = "/assets/globals-CwluhE98.css";
function Navbar({ currentUser }) {
  const location = useLocation();
  const isActive = (path) => {
    return location.pathname === path;
  };
  return /* @__PURE__ */ jsx("nav", { className: "bg-white shadow-md border-b border-gray-200", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center h-16", children: [
    /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(Link, { to: "/feed", className: "text-2xl font-bold text-blue-600 hover:text-blue-700", children: "Tweeter" }) }),
    currentUser && /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-8", children: [
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/feed",
          className: `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive("/feed") ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`,
          children: "Home"
        }
      ),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: `/profile/${currentUser.username}`,
          className: `px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname.startsWith(`/profile/${currentUser.username}`) ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`,
          children: "Profile"
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-600 border-l border-gray-300 pl-4", children: /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
        "@",
        currentUser.username
      ] }) }),
      /* @__PURE__ */ jsx(Form, { method: "post", action: "/signout", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors",
          children: "Sign Out"
        }
      ) })
    ] }),
    !currentUser && /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/signin",
          className: "px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900",
          children: "Sign In"
        }
      ),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/signup",
          className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors",
          children: "Sign Up"
        }
      )
    ] })
  ] }) }) });
}
function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.API_BASE_URL || "http://localhost:3000";
}
function getApiUrl(path) {
  const base = getApiBaseUrl();
  return `${base}${path}`;
}
const links = () => [{
  rel: "stylesheet",
  href: stylesheetUrl
}];
async function loader$4({
  request
}) {
  try {
    const cookie = request.headers.get("Cookie");
    console.log("=== Root Loader Debug ===");
    console.log("Request URL:", request.url);
    console.log("Cookie header from browser:", cookie);
    const headers = {};
    if (cookie) {
      headers["Cookie"] = cookie;
    }
    const response = await fetch(getApiUrl("/api/auth/me"), {
      headers
    });
    console.log("API /auth/me response status:", response.status);
    if (response.ok) {
      const data = await response.json();
      console.log("Current user from API:", data.user ? data.user.username : "null");
      return {
        currentUser: data.user || null
      };
    } else {
      console.log("API /auth/me failed, returning null user");
    }
  } catch (error) {
    console.log("Root loader error:", error);
  }
  return {
    currentUser: null
  };
}
const root = UNSAFE_withComponentProps(function Root() {
  const {
    currentUser
  } = useLoaderData();
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      className: "bg-gray-50 min-h-screen",
      children: [/* @__PURE__ */ jsx(Navbar, {
        currentUser
      }), /* @__PURE__ */ jsx(Outlet, {}), /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2() {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx("title", {
        children: "Error - Tweeter"
      })]
    }), /* @__PURE__ */ jsx("body", {
      className: "bg-gray-50 min-h-screen flex items-center justify-center",
      children: /* @__PURE__ */ jsxs("div", {
        className: "text-center",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-2xl font-bold text-gray-900 mb-2",
          children: "Oops! Something went wrong"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-gray-600",
          children: "Please try refreshing the page."
        })]
      })
    })]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  default: root,
  links,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
const Landing = UNSAFE_withComponentProps(function Landing2() {
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8",
    children: /* @__PURE__ */ jsxs("div", {
      className: "max-w-3xl w-full text-center space-y-8",
      children: [/* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-6xl font-bold text-blue-600 mb-4",
          children: "Tweeter"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-2xl text-gray-700 mb-8",
          children: "Join the conversation"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-lg text-gray-600 max-w-2xl mx-auto",
          children: "Share your thoughts, follow interesting people, and discover what's happening in the world right now."
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "flex flex-col sm:flex-row gap-4 justify-center",
        children: [/* @__PURE__ */ jsx(Link, {
          to: "/signup",
          className: "inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors",
          children: "Sign up"
        }), /* @__PURE__ */ jsx(Link, {
          to: "/signin",
          className: "inline-flex items-center justify-center px-8 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors",
          children: "Sign in"
        })]
      })]
    })
  });
});
function meta$6() {
  return [{
    title: "Tweeter - Join the conversation"
  }, {
    name: "description",
    content: "Share your thoughts with the world"
  }];
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Landing,
  meta: meta$6
}, Symbol.toStringTag, { value: "Module" }));
function SignupForm() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const validateUsername = (value) => {
    if (value.length < 3) return "Username must be at least 3 characters";
    if (value.length > 20) return "Username must be at most 20 characters";
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return "Username can only contain letters, numbers, hyphens, and underscores";
    }
    return null;
  };
  const validateEmail = (value) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Invalid email address";
    }
    return null;
  };
  const validatePassword = (value) => {
    if (value.length < 8) return "Password must be at least 8 characters";
    return null;
  };
  const handleUsernameChange = (value) => {
    setUsername(value);
    const error = validateUsername(value);
    setErrors((prev) => ({ ...prev, username: error || "" }));
  };
  const handleEmailChange = (value) => {
    setEmail(value);
    const error = validateEmail(value);
    setErrors((prev) => ({ ...prev, email: error || "" }));
  };
  const handlePasswordChange = (value) => {
    setPassword(value);
    const error = validatePassword(value);
    setErrors((prev) => ({ ...prev, password: error || "" }));
  };
  const hasErrors = Object.values(errors).some((e) => e) || !username || !email || !password;
  return /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-center text-3xl font-bold text-gray-900", children: "Create your account" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-center text-sm text-gray-600", children: "Join Tweeter today" })
    ] }),
    /* @__PURE__ */ jsxs(Form, { method: "post", className: "mt-8 space-y-6", children: [
      (actionData == null ? void 0 : actionData.error) && !(actionData == null ? void 0 : actionData.field) && /* @__PURE__ */ jsx("div", { className: "rounded-md bg-red-50 p-4", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-red-800", children: actionData.error }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "username", className: "block text-sm font-medium text-gray-700", children: "Username" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "username",
              name: "username",
              type: "text",
              value: username,
              onChange: (e) => handleUsernameChange(e.currentTarget.value),
              required: true,
              className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
              placeholder: "username"
            }
          ),
          errors.username && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.username }),
          (actionData == null ? void 0 : actionData.field) === "username" && (actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: actionData.error })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700", children: "Email address" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "email",
              name: "email",
              type: "email",
              value: email,
              onChange: (e) => handleEmailChange(e.currentTarget.value),
              required: true,
              className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
              placeholder: "you@example.com"
            }
          ),
          errors.email && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.email }),
          (actionData == null ? void 0 : actionData.field) === "email" && (actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: actionData.error })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700", children: "Password" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "password",
              name: "password",
              type: "password",
              value: password,
              onChange: (e) => {
                const value = e.target.value;
                handlePasswordChange(value);
              },
              required: true,
              className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
              placeholder: "••••••••"
            }
          ),
          errors.password && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.password })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: hasErrors || isSubmitting,
          className: "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed",
          children: isSubmitting ? "Creating account..." : "Sign up"
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "text-center text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "Already have an account? " }),
        /* @__PURE__ */ jsx("a", { href: "/signin", className: "font-medium text-blue-600 hover:text-blue-500", children: "Sign in" })
      ] })
    ] })
  ] });
}
const Signup = UNSAFE_withComponentProps(function Signup2() {
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8",
    children: /* @__PURE__ */ jsx(SignupForm, {})
  });
});
async function action$5({
  request
}) {
  const formData = await request.formData();
  const username = formData.get("username");
  const email = formData.get("email");
  const password = formData.get("password");
  if (!username || !email || !password) {
    return {
      error: "All fields are required"
    };
  }
  try {
    const response = await fetch(getApiUrl("/api/auth/signup"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      // CRITICAL: Allow cookies to be set
      body: JSON.stringify({
        username: username.toString(),
        email: email.toString(),
        password: password.toString()
      })
    });
    const data = await response.json();
    if (!response.ok) {
      return {
        error: data.error || "Signup failed",
        field: data.field
      };
    }
    const setCookie = response.headers.get("set-cookie");
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/feed",
        ...setCookie ? {
          "Set-Cookie": setCookie
        } : {}
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    return {
      error: "Network error. Please try again."
    };
  }
}
function meta$5() {
  return [{
    title: "Sign Up - Tweeter"
  }, {
    name: "description",
    content: "Create a new Tweeter account"
  }];
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5,
  default: Signup,
  meta: meta$5
}, Symbol.toStringTag, { value: "Module" }));
function SigninForm() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const validateEmail = (value) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Invalid email address";
    }
    return null;
  };
  const validatePassword = (value) => {
    if (value.length === 0) return "Password is required";
    return null;
  };
  const handleEmailChange = (value) => {
    setEmail(value);
    const error = validateEmail(value);
    setErrors((prev) => ({ ...prev, email: error || "" }));
  };
  const handlePasswordChange = (value) => {
    setPassword(value);
    const error = validatePassword(value);
    setErrors((prev) => ({ ...prev, password: error || "" }));
  };
  const hasErrors = Object.values(errors).some((e) => e) || !email || !password;
  return /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-center text-3xl font-bold text-gray-900", children: "Sign in to your account" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-center text-sm text-gray-600", children: "Welcome back to Tweeter" })
    ] }),
    /* @__PURE__ */ jsxs(Form, { method: "post", className: "mt-8 space-y-6", children: [
      (actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ jsx("div", { className: "rounded-md bg-red-50 p-4", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-red-800", children: actionData.error }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700", children: "Email address" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "email",
              name: "email",
              type: "email",
              value: email,
              onChange: (e) => handleEmailChange(e.currentTarget.value),
              required: true,
              className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
              placeholder: "you@example.com"
            }
          ),
          errors.email && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.email })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700", children: "Password" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "password",
              name: "password",
              type: "password",
              value: password,
              onChange: (e) => handlePasswordChange(e.currentTarget.value),
              required: true,
              className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
              placeholder: "••••••••"
            }
          ),
          errors.password && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.password })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: hasErrors || isSubmitting,
          className: "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed",
          children: isSubmitting ? "Signing in..." : "Sign in"
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "text-center text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "Don't have an account? " }),
        /* @__PURE__ */ jsx("a", { href: "/signup", className: "font-medium text-blue-600 hover:text-blue-500", children: "Sign up" })
      ] })
    ] })
  ] });
}
async function action$4({
  request
}) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  if (!email || !password) {
    return {
      error: "Email and password are required"
    };
  }
  try {
    const response = await fetch(getApiUrl("/api/auth/signin"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      // CRITICAL: Allow cookies to be set
      body: JSON.stringify({
        email,
        password
      })
    });
    const data = await response.json();
    if (!response.ok) {
      return {
        error: data.error || "Invalid credentials"
      };
    }
    const setCookie = response.headers.get("set-cookie");
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/feed",
        ...setCookie ? {
          "Set-Cookie": setCookie
        } : {}
      }
    });
  } catch (error) {
    console.error("Signin error:", error);
    return {
      error: "Network error. Please try again."
    };
  }
}
const Signin = UNSAFE_withComponentProps(function Signin2() {
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8",
    children: /* @__PURE__ */ jsx(SigninForm, {})
  });
});
function meta$4() {
  return [{
    title: "Sign In - Tweeter"
  }, {
    name: "description",
    content: "Sign in to your Tweeter account"
  }];
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  default: Signin,
  meta: meta$4
}, Symbol.toStringTag, { value: "Module" }));
async function action$3({
  request
}) {
  const cookie = request.headers.get("Cookie") || "";
  try {
    const response = await fetch(getApiUrl("/api/auth/signout"), {
      method: "POST",
      headers: {
        "Cookie": cookie
      }
    });
    const setCookie = response.headers.get("set-cookie");
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/signin",
        ...setCookie ? {
          "Set-Cookie": setCookie
        } : {}
      }
    });
  } catch (error) {
    console.error("Signout error:", error);
    return redirect("/signin");
  }
}
const Signout = UNSAFE_withComponentProps(function Signout2() {
  return null;
});
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  default: Signout
}, Symbol.toStringTag, { value: "Module" }));
const MAX_TWEET_LENGTH = 140;
function getColorState(count, maxLength) {
  if (count >= maxLength) {
    return "exceeded";
  }
  if (count >= maxLength - 20) {
    return "warning";
  }
  return "default";
}
function formatCounter(count, maxLength) {
  return `${count} / ${maxLength}`;
}
function TweetComposer() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [content, setContent] = useState("");
  const count = content.length;
  const isEmpty = content.trim().length === 0;
  const isOverLimit = count > MAX_TWEET_LENGTH;
  const isInvalid = isEmpty || isOverLimit;
  const colorState = useMemo(
    () => getColorState(count, MAX_TWEET_LENGTH),
    [count]
  );
  const handleContentChange = (e) => {
    setContent(e.currentTarget.value);
  };
  if (navigation.state === "loading" && !(actionData == null ? void 0 : actionData.error) && content) {
    setContent("");
  }
  return /* @__PURE__ */ jsx("div", { className: "max-w-2xl w-full mb-8", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-gray-900 mb-4", children: "What's happening?" }),
    /* @__PURE__ */ jsxs(Form, { method: "post", className: "space-y-4", children: [
      (actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ jsx("div", { className: "rounded-md bg-red-50 p-4", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-red-800", children: actionData.error }) }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
        "textarea",
        {
          id: "content",
          name: "content",
          value: content,
          onChange: handleContentChange,
          placeholder: "Share your thoughts...",
          rows: 4,
          className: "block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none",
          "aria-label": "Compose tweet"
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: `text-sm font-medium transition-colors duration-200 ${colorState === "exceeded" ? "text-red-600" : colorState === "warning" ? "text-yellow-400" : "text-gray-600"}`,
            role: "status",
            "aria-live": "polite",
            "aria-label": `Character count: ${formatCounter(count, MAX_TWEET_LENGTH)}`,
            children: formatCounter(count, MAX_TWEET_LENGTH)
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: isInvalid || isSubmitting,
            className: "px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed",
            children: isSubmitting ? "Posting..." : "Post Tweet"
          }
        )
      ] })
    ] })
  ] }) });
}
function formatTimestamp(date) {
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1e3);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 1) {
    if (diffSeconds < 60) {
      return diffSeconds === 1 ? "1 second ago" : `${diffSeconds} seconds ago`;
    }
    if (diffMinutes < 60) {
      return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
    }
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric"
  };
  return date.toLocaleDateString("en-US", options);
}
function formatTimestampFull(date) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  };
  return date.toLocaleDateString("en-US", options);
}
function LikeButton({ tweetId, initialLikeCount, initialIsLiked }) {
  const fetcher = useFetcher();
  const [optimisticLiked, setOptimisticLiked] = useState(initialIsLiked);
  const [optimisticCount, setOptimisticCount] = useState(initialLikeCount);
  useEffect(() => {
    setOptimisticLiked(initialIsLiked);
    setOptimisticCount(initialLikeCount);
  }, [initialIsLiked, initialLikeCount]);
  const isSubmitting = fetcher.state === "submitting";
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSubmitting) {
      const newLiked = !optimisticLiked;
      setOptimisticLiked(newLiked);
      setOptimisticCount(optimisticLiked ? optimisticCount - 1 : optimisticCount + 1);
      const formData = new FormData();
      formData.append("tweetId", tweetId);
      formData.append("action", newLiked ? "like" : "unlike");
      fetcher.submit(formData, {
        method: "post",
        action: `/tweets/${tweetId}/like`
      });
    }
  };
  return /* @__PURE__ */ jsx("div", { onClick: handleClick, children: /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      disabled: isSubmitting,
      className: `flex items-center space-x-2 px-3 py-1.5 rounded-full transition-all ${optimisticLiked ? "text-red-600 hover:bg-red-50" : "text-gray-600 hover:bg-gray-100"} ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`,
      "aria-label": optimisticLiked ? "Unlike tweet" : "Like tweet",
      children: [
        /* @__PURE__ */ jsx(
          "svg",
          {
            className: `w-5 h-5 ${optimisticLiked ? "fill-current" : "stroke-current fill-none"}`,
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            children: /* @__PURE__ */ jsx("path", { d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" })
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: optimisticCount })
      ]
    }
  ) });
}
function DeleteConfirmationModal({
  isOpen,
  tweetContent,
  onConfirm,
  onCancel,
  isDeleting
}) {
  return /* @__PURE__ */ jsxs(Modal, { show: isOpen, onClose: onCancel, size: "md", children: [
    /* @__PURE__ */ jsx(Modal.Header, { children: "Delete Tweet" }),
    /* @__PURE__ */ jsx(Modal.Body, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("p", { className: "text-gray-700", children: "Are you sure you want to delete this tweet?" }),
      /* @__PURE__ */ jsx("div", { className: "bg-gray-100 p-4 rounded-md", children: /* @__PURE__ */ jsxs("p", { className: "text-gray-900 italic", children: [
        '"',
        tweetContent,
        '"'
      ] }) }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "This action cannot be undone." })
    ] }) }),
    /* @__PURE__ */ jsxs(Modal.Footer, { children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          color: "failure",
          onClick: onConfirm,
          disabled: isDeleting,
          className: "bg-red-600 text-white hover:bg-red-700 focus:ring-4 focus:ring-red-300 disabled:bg-red-400",
          children: isDeleting ? "Deleting..." : "Delete"
        }
      ),
      /* @__PURE__ */ jsx(Button, { color: "gray", onClick: onCancel, disabled: isDeleting, children: "Cancel" })
    ] })
  ] });
}
function DeleteButton({ tweetId, tweetContent, onDeleteSuccess }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tweets/${tweetId}`, {
        method: "DELETE",
        credentials: "include"
        // Include cookies for JWT auth
      });
      if (response.ok) {
        setIsModalOpen(false);
        setIsDeleting(false);
        onDeleteSuccess == null ? void 0 : onDeleteSuccess();
      } else {
        const errorData = await response.json().catch(() => ({
          error: "Failed to delete tweet"
        }));
        console.error("Delete failed:", errorData.error);
        setIsDeleting(false);
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      setIsDeleting(false);
      alert("Network error. Please try again.");
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setIsModalOpen(true),
        className: "text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors",
        "aria-label": "Delete tweet",
        title: "Delete tweet",
        type: "button",
        children: /* @__PURE__ */ jsxs(
          "svg",
          {
            className: "w-5 h-5",
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            children: [
              /* @__PURE__ */ jsx("polyline", { points: "3 6 5 6 21 6" }),
              /* @__PURE__ */ jsx("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }),
              /* @__PURE__ */ jsx("line", { x1: "10", y1: "11", x2: "10", y2: "17" }),
              /* @__PURE__ */ jsx("line", { x1: "14", y1: "11", x2: "14", y2: "17" })
            ]
          }
        )
      }
    ),
    /* @__PURE__ */ jsx(
      DeleteConfirmationModal,
      {
        isOpen: isModalOpen,
        tweetContent,
        onConfirm: handleDelete,
        onCancel: () => setIsModalOpen(false),
        isDeleting
      }
    )
  ] });
}
function TweetCard({
  tweet,
  currentUserId
}) {
  const navigate = useNavigate();
  const [isOptimisticallyDeleted, setIsOptimisticallyDeleted] = useState(false);
  const handleCardClick = () => {
    navigate(`/tweets/${tweet.id}`);
  };
  const handleUsernameClick = (e) => {
    e.stopPropagation();
  };
  const handleDeleteSuccess = () => {
    setIsOptimisticallyDeleted(true);
  };
  if (isOptimisticallyDeleted) {
    return null;
  }
  return /* @__PURE__ */ jsxs(
    "article",
    {
      className: "bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer",
      onClick: handleCardClick,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: `/profile/${tweet.author.username}`,
              className: "font-semibold text-gray-900 hover:text-blue-600 hover:underline",
              onClick: handleUsernameClick,
              "aria-label": `View ${tweet.author.username}'s profile`,
              children: [
                "@",
                tweet.author.username
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "time",
            {
              dateTime: tweet.createdAt.toISOString(),
              title: formatTimestampFull(tweet.createdAt),
              className: "text-sm text-gray-500",
              children: formatTimestamp(tweet.createdAt)
            }
          )
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-800 text-base whitespace-pre-wrap break-words mb-3", children: tweet.content }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx(
            LikeButton,
            {
              tweetId: tweet.id,
              initialLikeCount: tweet.likeCount,
              initialIsLiked: tweet.isLikedByUser
            }
          ) }),
          currentUserId && currentUserId === tweet.author.id && /* @__PURE__ */ jsx("div", { onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx(
            DeleteButton,
            {
              tweetId: tweet.id,
              tweetContent: tweet.content,
              onDeleteSuccess: handleDeleteSuccess
            }
          ) })
        ] })
      ]
    }
  );
}
function TweetList({
  tweets,
  currentUserId
}) {
  if (tweets.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-md p-12 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-lg", children: "No tweets yet." }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm mt-2", children: "Be the first to post!" })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: tweets.map((tweet) => /* @__PURE__ */ jsx(TweetCard, { tweet, currentUserId }, tweet.id)) });
}
async function loader$3({
  request
}) {
  var _a;
  const cookie = request.headers.get("Cookie") || "";
  try {
    const response = await fetch(getApiUrl("/api/tweets"), {
      headers: {
        "Cookie": cookie
        // Forward authentication cookies to backend
      }
    });
    if (!response.ok) {
      throw new Error("Failed to fetch tweets");
    }
    const data = await response.json();
    const tweets = data.tweets.map((tweet) => ({
      ...tweet,
      createdAt: new Date(tweet.createdAt)
    }));
    let currentUserId = null;
    try {
      const meResponse = await fetch(getApiUrl("/api/auth/me"), {
        headers: {
          "Cookie": cookie
        }
      });
      if (meResponse.ok) {
        const meData = await meResponse.json();
        currentUserId = ((_a = meData.user) == null ? void 0 : _a.id) || null;
      }
    } catch {
    }
    return {
      tweets,
      currentUserId
    };
  } catch (error) {
    console.error("Feed loader error:", error);
    return {
      tweets: [],
      currentUserId: null
    };
  }
}
async function action$2({
  request
}) {
  const formData = await request.formData();
  const content = formData.get("content");
  if (!content || content.trim().length === 0) {
    return {
      error: "Tweet content is required"
    };
  }
  if (content.length > 140) {
    return {
      error: "Tweet must be 140 characters or less"
    };
  }
  const cookie = request.headers.get("Cookie") || "";
  console.log("=== Feed Action Debug ===");
  console.log("Cookies from request:", cookie);
  console.log("All request headers:", Array.from(request.headers.entries()));
  try {
    const url = getApiUrl("/api/tweets");
    console.log("Posting to URL:", url);
    console.log("Request body:", JSON.stringify({
      content
    }));
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookie
        // Forward authentication cookies to backend
      },
      body: JSON.stringify({
        content
      })
    });
    console.log("Tweet post response status:", response.status, response.ok);
    console.log("Tweet post response headers:", Array.from(response.headers.entries()));
    if (!response.ok) {
      const errorData = await response.json();
      console.log("Tweet post error data:", errorData);
      return {
        error: errorData.error || "Failed to post tweet"
      };
    }
    const data = await response.json();
    console.log("Tweet post success data:", data);
    return {
      success: true
    };
  } catch (error) {
    console.error("Tweet post error:", error);
    return {
      error: "Network error. Please try again."
    };
  }
}
const Feed = UNSAFE_withComponentProps(function Feed2() {
  const {
    tweets,
    currentUserId
  } = useLoaderData();
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8",
    children: /* @__PURE__ */ jsxs("div", {
      className: "max-w-2xl mx-auto",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "mb-8",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-3xl font-bold text-gray-900",
          children: "Feed"
        }), /* @__PURE__ */ jsx("p", {
          className: "mt-2 text-sm text-gray-600",
          children: "See what everyone is talking about"
        })]
      }), /* @__PURE__ */ jsx(TweetComposer, {}), /* @__PURE__ */ jsx(TweetList, {
        tweets,
        currentUserId: currentUserId || void 0
      })]
    })
  });
});
function meta$3() {
  return [{
    title: "Feed - Tweeter"
  }, {
    name: "description",
    content: "Your personalized tweet feed"
  }];
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: Feed,
  loader: loader$3,
  meta: meta$3
}, Symbol.toStringTag, { value: "Module" }));
async function loader$2({
  request,
  params
}) {
  var _a;
  const {
    id
  } = params;
  if (!id) {
    throw new Response("Tweet ID required", {
      status: 400
    });
  }
  const cookie = request.headers.get("Cookie") || "";
  try {
    const response = await fetch(getApiUrl(`/api/tweets/${id}`), {
      headers: {
        "Cookie": cookie
      }
    });
    if (response.status === 404) {
      throw new Response("Tweet not found", {
        status: 404
      });
    }
    if (!response.ok) {
      throw new Error("Failed to fetch tweet");
    }
    const data = await response.json();
    const tweet = {
      ...data.tweet,
      createdAt: new Date(data.tweet.createdAt)
    };
    let currentUserId = null;
    try {
      const meResponse = await fetch(getApiUrl("/api/auth/me"), {
        headers: {
          "Cookie": cookie
        }
      });
      if (meResponse.ok) {
        const meData = await meResponse.json();
        currentUserId = ((_a = meData.user) == null ? void 0 : _a.id) || null;
      }
    } catch {
    }
    return {
      tweet,
      currentUserId
    };
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error("Tweet detail loader error:", error);
    throw new Response("Failed to load tweet", {
      status: 500
    });
  }
}
const TweetDetail = UNSAFE_withComponentProps(function TweetDetail2() {
  const {
    tweet,
    currentUserId
  } = useLoaderData();
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8",
    children: /* @__PURE__ */ jsxs("div", {
      className: "max-w-2xl mx-auto",
      children: [/* @__PURE__ */ jsx("div", {
        className: "mb-6",
        children: /* @__PURE__ */ jsx("a", {
          href: "/feed",
          className: "text-blue-600 hover:text-blue-800 font-medium text-sm",
          children: "← Back to Feed"
        })
      }), /* @__PURE__ */ jsxs("div", {
        className: "mb-6",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-2xl font-bold text-gray-900 mb-4",
          children: "Tweet"
        }), /* @__PURE__ */ jsx(TweetCard, {
          tweet,
          currentUserId: currentUserId || void 0
        })]
      })]
    })
  });
});
function meta$2({
  data
}) {
  var _a;
  const tweetContent = ((_a = data == null ? void 0 : data.tweet) == null ? void 0 : _a.content) || "Tweet";
  const truncated = tweetContent.length > 60 ? tweetContent.substring(0, 60) + "..." : tweetContent;
  return [{
    title: `${truncated} - Tweeter`
  }, {
    name: "description",
    content: tweetContent
  }];
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: TweetDetail,
  loader: loader$2,
  meta: meta$2
}, Symbol.toStringTag, { value: "Module" }));
async function toggleLikeAction({ request, params }) {
  console.log("=== toggleLikeAction called ===");
  console.log("URL:", request.url);
  console.log("Method:", request.method);
  const formData = await request.formData();
  const tweetId = formData.get("tweetId");
  const action2 = formData.get("action");
  console.log("tweetId:", tweetId);
  console.log("action:", action2);
  if (!tweetId) {
    console.log("ERROR: No tweetId provided");
    return { error: "Tweet ID is required" };
  }
  const cookie = request.headers.get("Cookie");
  const headers = {
    "Content-Type": "application/json"
  };
  if (cookie) {
    headers["Cookie"] = cookie;
  }
  try {
    if (action2 === "like") {
      console.log("Calling API: POST /api/likes with tweetId:", tweetId);
      const response = await fetch(getApiUrl("/api/likes"), {
        method: "POST",
        headers,
        body: JSON.stringify({ tweetId })
      });
      console.log("API Response status:", response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.log("API Error:", errorData);
        const referrer = request.headers.get("Referer");
        if (referrer) {
          try {
            return redirect(new URL(referrer).pathname);
          } catch {
            return redirect("/feed");
          }
        }
        return redirect("/feed");
      }
      console.log("Like created successfully");
    } else {
      console.log("Calling API: DELETE /api/likes with tweetId:", tweetId);
      const response = await fetch(getApiUrl("/api/likes"), {
        method: "DELETE",
        headers,
        body: JSON.stringify({ tweetId })
      });
      console.log("API Response status:", response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.log("API Error:", errorData);
        const referrer = request.headers.get("Referer");
        if (referrer) {
          try {
            return redirect(new URL(referrer).pathname);
          } catch {
            return redirect("/feed");
          }
        }
        return redirect("/feed");
      }
      console.log("Like removed successfully");
    }
    console.log("Like action completed successfully");
    return null;
  } catch (error) {
    console.error("Like action error:", error);
    return { error: "Network error. Please try again." };
  }
}
const action$1 = toggleLikeAction;
const LikeAction = UNSAFE_withComponentProps(function LikeAction2() {
  return null;
});
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: LikeAction
}, Symbol.toStringTag, { value: "Module" }));
const tweetWithAuthorAndLikesSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1).max(140),
  createdAt: z.coerce.date(),
  // Coerce string to Date
  author: z.object({
    id: z.string().uuid(),
    username: z.string().min(1)
  }),
  likeCount: z.number().int().min(0),
  isLikedByUser: z.boolean()
});
const getUserTweetsResponseSchema = z.object({
  tweets: z.array(tweetWithAuthorAndLikesSchema)
});
async function fetchTweetsByUsername(username) {
  const response = await fetch(getApiUrl(`/api/tweets/user/${username}`), {
    credentials: "include"
    // Include authentication cookie
  });
  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`Failed to fetch tweets: ${response.statusText}`);
  }
  const data = await response.json();
  const validated = getUserTweetsResponseSchema.parse(data);
  return validated.tweets;
}
async function loader$1({
  request,
  params
}) {
  var _a;
  const {
    username
  } = params;
  if (!username) {
    throw new Response("Username is required", {
      status: 400
    });
  }
  const cookie = request.headers.get("Cookie") || "";
  try {
    const response = await fetch(getApiUrl(`/api/profiles/${username}`), {
      headers: {
        "Cookie": cookie
      }
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Response("Profile not found", {
          status: 404
        });
      }
      throw new Response("Failed to fetch profile", {
        status: 500
      });
    }
    const data = await response.json();
    let currentUserId = null;
    let isOwnProfile = false;
    try {
      const meResponse = await fetch(getApiUrl("/api/auth/me"), {
        headers: {
          "Cookie": cookie
        }
      });
      if (meResponse.ok) {
        const meData = await meResponse.json();
        currentUserId = ((_a = meData.user) == null ? void 0 : _a.id) || null;
        isOwnProfile = currentUserId === data.profile.id;
      }
    } catch {
    }
    const tweets = await fetchTweetsByUsername(username);
    return {
      profile: data.profile,
      isOwnProfile,
      currentUserId,
      tweets
      // NEW: Include tweets in loader data
    };
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error("Profile loader error:", error);
    throw new Response("Failed to load profile", {
      status: 500
    });
  }
}
const Profile = UNSAFE_withComponentProps(function Profile2() {
  const {
    profile,
    isOwnProfile,
    currentUserId,
    tweets
  } = useLoaderData();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8",
    children: /* @__PURE__ */ jsxs("div", {
      className: "max-w-3xl mx-auto",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "bg-white rounded-lg shadow-md overflow-hidden",
        children: [/* @__PURE__ */ jsx("div", {
          className: "h-32 bg-gradient-to-r from-blue-500 to-purple-600"
        }), /* @__PURE__ */ jsxs("div", {
          className: "px-6 pb-6",
          children: [/* @__PURE__ */ jsx("div", {
            className: "relative -mt-16 mb-4",
            children: profile.avatarUrl ? /* @__PURE__ */ jsx("img", {
              src: profile.avatarUrl,
              alt: `${profile.username}'s avatar`,
              className: "w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
            }) : /* @__PURE__ */ jsx("div", {
              className: "w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-300 flex items-center justify-center",
              children: /* @__PURE__ */ jsx("span", {
                className: "text-4xl text-gray-600 font-bold",
                children: profile.username.charAt(0).toUpperCase()
              })
            })
          }), /* @__PURE__ */ jsxs("div", {
            className: "mb-4",
            children: [/* @__PURE__ */ jsxs("h1", {
              className: "text-3xl font-bold text-gray-900 mb-1",
              children: ["@", profile.username]
            }), /* @__PURE__ */ jsx("p", {
              className: "text-gray-600",
              children: profile.email
            })]
          }), profile.bio && /* @__PURE__ */ jsx("div", {
            className: "mb-4",
            children: /* @__PURE__ */ jsx("p", {
              className: "text-gray-800 whitespace-pre-wrap",
              children: profile.bio
            })
          }), /* @__PURE__ */ jsx("div", {
            className: "flex items-center space-x-6 mb-6",
            children: /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-2xl font-bold text-gray-900",
                children: profile.tweetCount
              }), /* @__PURE__ */ jsx("span", {
                className: "text-gray-600 ml-2",
                children: "Tweets"
              })]
            })
          }), isOwnProfile && /* @__PURE__ */ jsx("div", {
            children: /* @__PURE__ */ jsx(Link, {
              to: `/profile/${profile.username}/edit`,
              className: "inline-block px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors",
              children: "Edit Profile"
            })
          })]
        })]
      }), /* @__PURE__ */ jsxs("section", {
        className: "mt-8",
        "aria-labelledby": "user-tweets-heading",
        children: [/* @__PURE__ */ jsx("h2", {
          id: "user-tweets-heading",
          className: "text-2xl font-bold text-gray-900 mb-4",
          children: "Tweets"
        }), isLoading ? (
          // Loading state
          /* @__PURE__ */ jsx("div", {
            className: "flex justify-center py-12",
            children: /* @__PURE__ */ jsx("div", {
              className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
            })
          })
        ) : tweets.length === 0 ? (
          // Empty state - Enhanced for Feature 909
          /* @__PURE__ */ jsxs("div", {
            className: "bg-white rounded-lg shadow-md p-12 text-center",
            role: "status",
            "aria-live": "polite",
            children: [/* @__PURE__ */ jsx("div", {
              className: "mb-4 flex justify-center",
              children: /* @__PURE__ */ jsx("svg", {
                className: "w-16 h-16 text-gray-300",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                xmlns: "http://www.w3.org/2000/svg",
                "aria-hidden": "true",
                children: /* @__PURE__ */ jsx("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 1.5,
                  d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                })
              })
            }), /* @__PURE__ */ jsx("h3", {
              className: "text-lg font-semibold text-gray-900 mb-2",
              children: "No tweets yet"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-gray-500 max-w-sm mx-auto",
              children: isOwnProfile ? "You haven't posted any tweets yet. Share your first thought with the world!" : `@${profile.username} hasn't posted any tweets yet.`
            })]
          })
        ) : (
          // Tweets list - Feature: 910 - Pass currentUserId for delete button
          /* @__PURE__ */ jsx("div", {
            className: "space-y-4",
            children: tweets.map((tweet) => /* @__PURE__ */ jsx(TweetCard, {
              tweet,
              currentUserId: currentUserId || void 0
            }, tweet.id))
          })
        )]
      }), /* @__PURE__ */ jsx("div", {
        className: "mt-6",
        children: /* @__PURE__ */ jsx(Link, {
          to: "/feed",
          className: "text-blue-600 hover:text-blue-700 hover:underline",
          children: "← Back to Feed"
        })
      })]
    })
  });
});
function meta$1({
  data
}) {
  return [{
    title: `@${data.profile.username} - Tweeter`
  }, {
    name: "description",
    content: `Profile page for @${data.profile.username}`
  }];
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Profile,
  loader: loader$1,
  meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
const profileEditSchema = z.object({
  bio: z.string().max(160, "Bio must be 160 characters or less").optional(),
  avatarUrl: z.string().url("Invalid URL").or(z.literal("")).optional()
});
async function loader({
  request,
  params
}) {
  var _a;
  const {
    username
  } = params;
  if (!username) {
    throw new Response("Username is required", {
      status: 400
    });
  }
  const cookie = request.headers.get("Cookie") || "";
  try {
    const response = await fetch(getApiUrl(`/api/profiles/${username}`), {
      headers: {
        "Cookie": cookie
      }
    });
    if (!response.ok) {
      throw new Response("Failed to fetch profile", {
        status: response.status
      });
    }
    const data = await response.json();
    try {
      const meResponse = await fetch(getApiUrl("/api/auth/me"), {
        headers: {
          "Cookie": cookie
        }
      });
      if (meResponse.ok) {
        const meData = await meResponse.json();
        if (((_a = meData.user) == null ? void 0 : _a.id) !== data.profile.id) {
          throw new Response("You can only edit your own profile", {
            status: 403
          });
        }
      } else {
        throw new Response("Authentication required", {
          status: 401
        });
      }
    } catch (error) {
      throw new Response("Authentication required", {
        status: 401
      });
    }
    return {
      profile: data.profile
    };
  } catch (error) {
    console.error("Profile edit loader error:", error);
    throw error;
  }
}
async function action({
  request,
  params
}) {
  const {
    username
  } = params;
  if (!username) {
    return {
      error: "Username is required"
    };
  }
  const formData = await request.formData();
  const bio = formData.get("bio");
  const avatarUrl = formData.get("avatarUrl");
  const result = profileEditSchema.safeParse({
    bio,
    avatarUrl
  });
  if (!result.success) {
    return {
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors
    };
  }
  const cookie = request.headers.get("Cookie") || "";
  try {
    const response = await fetch(getApiUrl(`/api/profiles/${username}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookie
      },
      body: JSON.stringify({
        bio: bio || ""
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      return {
        error: errorData.error || "Failed to update profile"
      };
    }
    return redirect(`/profile/${username}`);
  } catch (error) {
    console.error("Profile update error:", error);
    return {
      error: "Network error. Please try again."
    };
  }
}
const ProfileEdit = UNSAFE_withComponentProps(function ProfileEdit2() {
  var _a, _b;
  const {
    profile
  } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [bioLength, setBioLength] = useState((profile.bio || "").length);
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8",
    children: /* @__PURE__ */ jsxs("div", {
      className: "max-w-2xl mx-auto",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "mb-8",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-3xl font-bold text-gray-900",
          children: "Edit Profile"
        }), /* @__PURE__ */ jsx("p", {
          className: "mt-2 text-sm text-gray-600",
          children: "Update your profile information"
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "bg-white rounded-lg shadow-md p-6",
        children: /* @__PURE__ */ jsxs(Form, {
          method: "post",
          children: [(actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ jsx("div", {
            className: "mb-6 p-4 bg-red-50 border border-red-200 rounded-md",
            children: /* @__PURE__ */ jsx("p", {
              className: "text-sm text-red-800",
              children: actionData.error
            })
          }), /* @__PURE__ */ jsxs("div", {
            className: "mb-6",
            children: [/* @__PURE__ */ jsx("label", {
              htmlFor: "bio",
              className: "block text-sm font-medium text-gray-700 mb-2",
              children: "Bio"
            }), /* @__PURE__ */ jsx("textarea", {
              id: "bio",
              name: "bio",
              rows: 4,
              maxLength: 160,
              defaultValue: profile.bio || "",
              onChange: (e) => setBioLength(e.target.value.length),
              className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              placeholder: "Tell us about yourself..."
            }), /* @__PURE__ */ jsxs("div", {
              className: "mt-1 flex justify-between items-center",
              children: [/* @__PURE__ */ jsx("p", {
                className: "text-xs text-gray-500",
                children: ((_a = actionData == null ? void 0 : actionData.fieldErrors) == null ? void 0 : _a.bio) && /* @__PURE__ */ jsx("span", {
                  className: "text-red-600",
                  children: actionData.fieldErrors.bio[0]
                })
              }), /* @__PURE__ */ jsxs("p", {
                className: "text-xs text-gray-500",
                children: [bioLength, " / 160 characters"]
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "mb-6",
            children: [/* @__PURE__ */ jsx("label", {
              htmlFor: "avatarUrl",
              className: "block text-sm font-medium text-gray-700 mb-2",
              children: "Avatar URL"
            }), /* @__PURE__ */ jsx("input", {
              type: "text",
              id: "avatarUrl",
              name: "avatarUrl",
              defaultValue: profile.avatarUrl || "",
              className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              placeholder: "https://example.com/avatar.jpg"
            }), ((_b = actionData == null ? void 0 : actionData.fieldErrors) == null ? void 0 : _b.avatarUrl) && /* @__PURE__ */ jsx("p", {
              className: "mt-1 text-xs text-red-600",
              children: actionData.fieldErrors.avatarUrl[0]
            }), /* @__PURE__ */ jsx("p", {
              className: "mt-1 text-xs text-gray-500",
              children: "Enter a URL to an image you want to use as your avatar"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex items-center space-x-4",
            children: [/* @__PURE__ */ jsx("button", {
              type: "submit",
              disabled: isSubmitting,
              className: "px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              children: isSubmitting ? "Saving..." : "Save Changes"
            }), /* @__PURE__ */ jsx(Link, {
              to: `/profile/${profile.username}`,
              className: "px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors",
              children: "Cancel"
            })]
          })]
        })
      })]
    })
  });
});
function meta({
  data
}) {
  return [{
    title: `Edit Profile - @${data.profile.username}`
  }, {
    name: "description",
    content: "Edit your profile information"
  }];
}
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  default: ProfileEdit,
  loader,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-CwfMkriG.js", "imports": ["/assets/jsx-runtime-DFKfvEBC.js", "/assets/chunk-OIYGIGL5-DmD0wY_A.js", "/assets/index-Bc3PYlUX.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-uAYn2-x8.js", "imports": ["/assets/jsx-runtime-DFKfvEBC.js", "/assets/chunk-OIYGIGL5-DmD0wY_A.js", "/assets/index-Bc3PYlUX.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "pages/Landing": { "id": "pages/Landing", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/Landing-BuWtS3T2.js", "imports": ["/assets/chunk-OIYGIGL5-DmD0wY_A.js", "/assets/jsx-runtime-DFKfvEBC.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "pages/Signup": { "id": "pages/Signup", "parentId": "root", "path": "/signup", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/Signup-DvF6RTh5.js", "imports": ["/assets/chunk-OIYGIGL5-DmD0wY_A.js", "/assets/jsx-runtime-DFKfvEBC.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "pages/Signin": { "id": "pages/Signin", "parentId": "root", "path": "/signin", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/Signin-CuhImZWp.js", "imports": ["/assets/chunk-OIYGIGL5-DmD0wY_A.js", "/assets/jsx-runtime-DFKfvEBC.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "pages/Signout": { "id": "pages/Signout", "parentId": "root", "path": "/signout", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/Signout-D69NYZ3J.js", "imports": ["/assets/chunk-OIYGIGL5-DmD0wY_A.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "pages/Feed": { "id": "pages/Feed", "parentId": "root", "path": "/feed", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/Feed-_oqwM3fH.js", "imports": ["/assets/chunk-OIYGIGL5-DmD0wY_A.js", "/assets/jsx-runtime-DFKfvEBC.js", "/assets/TweetCard-YIXopdUb.js", "/assets/index-Bc3PYlUX.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "pages/TweetDetail": { "id": "pages/TweetDetail", "parentId": "root", "path": "/tweets/:id", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/TweetDetail-DQWkqTtW.js", "imports": ["/assets/chunk-OIYGIGL5-DmD0wY_A.js", "/assets/jsx-runtime-DFKfvEBC.js", "/assets/TweetCard-YIXopdUb.js", "/assets/index-Bc3PYlUX.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "pages/LikeAction": { "id": "pages/LikeAction", "parentId": "root", "path": "/tweets/:id/like", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/LikeAction-D1lsXvuD.js", "imports": ["/assets/chunk-OIYGIGL5-DmD0wY_A.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "pages/Profile": { "id": "pages/Profile", "parentId": "root", "path": "/profile/:username", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/Profile-Cxb-ZjPk.js", "imports": ["/assets/chunk-OIYGIGL5-DmD0wY_A.js", "/assets/jsx-runtime-DFKfvEBC.js", "/assets/TweetCard-YIXopdUb.js", "/assets/index-Bc3PYlUX.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "pages/ProfileEdit": { "id": "pages/ProfileEdit", "parentId": "root", "path": "/profile/:username/edit", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/ProfileEdit-CvtLyQ7i.js", "imports": ["/assets/chunk-OIYGIGL5-DmD0wY_A.js", "/assets/jsx-runtime-DFKfvEBC.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-bfb21b77.js", "version": "bfb21b77", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v8_middleware": false, "unstable_optimizeDeps": false, "unstable_splitRouteModules": false, "unstable_subResourceIntegrity": false, "unstable_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "pages/Landing": {
    id: "pages/Landing",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "pages/Signup": {
    id: "pages/Signup",
    parentId: "root",
    path: "/signup",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "pages/Signin": {
    id: "pages/Signin",
    parentId: "root",
    path: "/signin",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "pages/Signout": {
    id: "pages/Signout",
    parentId: "root",
    path: "/signout",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "pages/Feed": {
    id: "pages/Feed",
    parentId: "root",
    path: "/feed",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "pages/TweetDetail": {
    id: "pages/TweetDetail",
    parentId: "root",
    path: "/tweets/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "pages/LikeAction": {
    id: "pages/LikeAction",
    parentId: "root",
    path: "/tweets/:id/like",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "pages/Profile": {
    id: "pages/Profile",
    parentId: "root",
    path: "/profile/:username",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "pages/ProfileEdit": {
    id: "pages/ProfileEdit",
    parentId: "root",
    path: "/profile/:username/edit",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
