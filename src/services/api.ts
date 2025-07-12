import { Collection, CollectionFull, HttpRequest, Environment } from "../types";

class ApiService {
  private baseUrl = import.meta.env.VITE_API_URL;

  // Collections API
  async getCollections(): Promise<Collection[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/collection`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching collections:", error);
      throw error;
    }
  }

  async getCollectionById(collectionId: string): Promise<CollectionFull> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/collection/${collectionId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching collection:", error);
      throw error;
    }
  }

  async createCollection(
    collection: Omit<Collection, "_id" | "size" | "createdAt">
  ): Promise<Collection> {
    try {
      const response = await fetch(`${this.baseUrl}/api/collection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(collection),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating collection:", error);
      throw error;
    }
  }

  async updateCollection(
    collectionId: string,
    updates: Partial<Collection>
  ): Promise<Collection> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/collection/${collectionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating collection:", error);
      throw error;
    }
  }

  async deleteCollection(collectionId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/collection/${collectionId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
      throw error;
    }
  }

  // Requests API
  async createRequest(
    collectionId: string,
    request: Omit<
      HttpRequest,
      "_id" | "createdAt" | "updatedAt" | "collectionId"
    >
  ): Promise<HttpRequest> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/collection/${collectionId}/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating request:", error);
      // Return mock data for development
      return {
        _id: Date.now().toString(),
        ...request,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  async updateRequest(
    collectionId: string,
    requestId: string,
    updates: Partial<HttpRequest>
  ): Promise<HttpRequest> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/collection/${collectionId}/request/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating request:", error);
      throw error;
    }
  }

  async deleteRequest(collectionId: string, requestId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/collection/${collectionId}/request/${requestId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting request:", error);
      throw error;
    }
  }

  // Search Collections
  async searchCollections(query: string): Promise<Collection[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/collection/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error searching collections:", error);
      throw error;
    }
  }

    async searchEnvironments(query: string): Promise<Environment[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/environment/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error searching environment:", error);
      throw error;
    }
  }

  // Environments API
  async getEnvironments(): Promise<Environment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/environment`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching environments:", error);
      throw error;
    }
  }

  async createEnvironment(
    environment: Omit<Environment, "_id" | "createdAt" | "isActive">
  ): Promise<Environment> {
    try {
      const response = await fetch(`${this.baseUrl}/api/environment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(environment),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating environment:", error);
      throw error;
    }
  }

  async updateEnvironment(
    environmentId: string,
    updates: Omit<Environment, "_id" | "isActive" | "createdAt">
  ): Promise<Environment> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/environment/${environmentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating environment:", error);
      throw error;
    }
  }

  async deleteEnvironment(environmentId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/environment/${environmentId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting environment:", error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
