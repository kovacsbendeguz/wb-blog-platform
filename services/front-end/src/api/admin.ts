const API_URL = "https://b5w4i622r3.execute-api.eu-central-1.amazonaws.com/prod";

// Get all users (admin only)
export const getUsers = async (
  token: string,
  limit: number = 10,
  nextToken?: string
): Promise<{
  users: any[];
  nextToken: string | null;
}> => {
  try {
    let url = `${API_URL}/admin/users?limit=${limit}`;
    if (nextToken) {
      url += `&nextToken=${nextToken}`;
    }

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Update user roles (admin only)
export const updateUserRole = async (
  userId: string,
  role: string,
  token: string
): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update user role: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

// Get system statistics (admin only)
export const getSystemStats = async (token: string): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/admin/stats`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch system stats: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching system stats:", error);
    throw error;
  }
};

// Export data (admin only)
export const exportData = async (
  type: 'articles' | 'users' | 'metrics',
  token: string
): Promise<{ exportUrl: string; expiresAt: string }> => {
  try {
    const response = await fetch(`${API_URL}/admin/export/${type}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to export ${type}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Error exporting ${type}:`, error);
    throw error;
  }
};

// Set user as admin
export const setUserAsAdmin = async (
  username: string,
  token: string
): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${API_URL}/auth/set-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      throw new Error(`Failed to set user as admin: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error setting user as admin:", error);
    throw error;
  }
};