const refreshAccessToken = async () => {
  try {
    const response = await fetch("/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

const isAdminContext = () => {
  const path = window.location.pathname || "";
  return path.startsWith("/admin") || path.startsWith("/auth");
};

const buildClientLoginUrl = () => {
  const nextUrl = `${window.location.pathname || "/"}${
    window.location.search || ""
  }`;
  return `/client/auth/login?next=${encodeURIComponent(nextUrl)}`;
};

const apiCall = async (url, options = {}) => {
  try {
    if (!options.headers) {
      options.headers = {};
    }

    options.credentials = options.credentials || "include";

    let response = await fetch(url, options);

    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        response = await fetch(url, options);
      } else {
        window.location.href = isAdminContext()
          ? "/auth/admin"
          : buildClientLoginUrl();
        return response;
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
};

const apiGet = async (url) => {
  return apiCall(url, { method: "GET" });
};

const apiPost = async (url, body) => {
  const options = {
    method: "POST",
    body: body,
  };

  if (!(body instanceof FormData)) {
    if (!options.headers) {
      options.headers = {};
    }
    options.headers["Content-Type"] = "application/json";
  }

  return apiCall(url, options);
};

const apiDelete = async (url) => {
  return apiCall(url, { method: "DELETE" });
};

const apiPatch = async (url, body) => {
  const options = {
    method: "PATCH",
  };

  if (body) {
    options.body = body;

    if (!(body instanceof FormData)) {
      if (!options.headers) {
        options.headers = {};
      }
      options.headers["Content-Type"] = "application/json";
    }
  }

  return apiCall(url, options);
};

const apiPut = async (url, body) => {
  const options = {
    method: "PUT",
    body: body,
  };

  if (!(body instanceof FormData)) {
    if (!options.headers) {
      options.headers = {};
    }
    options.headers["Content-Type"] = "application/json";
  }

  return apiCall(url, options);
};

export {
  refreshAccessToken,
  apiCall,
  apiGet,
  apiPost,
  apiDelete,
  apiPatch,
  apiPut,
};

if (typeof window !== "undefined") {
  window.api = {
    refreshAccessToken,
    apiCall,
    apiGet,
    apiPost,
    apiDelete,
    apiPatch,
    apiPut,
  };
}
