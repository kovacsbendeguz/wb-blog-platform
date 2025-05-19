import { User } from "../types";

const API_URL = "https://b5w4i622r3.execute-api.eu-central-1.amazonaws.com/prod";

export interface UpdateProfilePayload {
  name?: string;
  bio?: string;
  profileImage?: string;
  // Add any other profile fields
}

// Get the user's profile
export const getUserProfile = async (token: string): Promise<User> => {
  try {
    const response = await fetch(`${API_URL}/profile`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

// Update the user's profile
export const updateUserProfile = async (
  payload: UpdateProfilePayload,
  token: string
): Promise<User> => {
  try {
    const response = await fetch(`${API_URL}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to update profile: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

// Get articles by a specific author
export const getAuthorArticles = async (
  authorId: string,
  token: string,
  limit: number = 10, 
  nextToken?: string
): Promise<{
  articles: any[];
  nextToken: string | null;
}> => {
  try {
    let url = `${API_URL}/profile/${authorId}/articles?limit=${limit}`;
    if (nextToken) {
      url += `&nextToken=${nextToken}`;
    }

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch author articles: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching author articles:", error);
    throw error;
  }
};