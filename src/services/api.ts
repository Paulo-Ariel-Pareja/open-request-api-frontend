import axios, { AxiosInstance, AxiosResponse } from "axios";
import { Collection, CollectionFull, HttpRequest, Environment } from "../types";

class ApiService {
  private baseUrl = import.meta.env.VITE_API_URL;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add response interceptor for better error handling
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        console.error("API Error:", error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Collections API
  async getCollections(): Promise<Collection[]> {
    try {
      const response = await this.axiosInstance.get("/api/collection");
      return response.data;
    } catch (error) {
      console.error("Error fetching collections:", error);
      throw error;
    }
  }

  async getCollectionById(collectionId: string): Promise<CollectionFull> {
    try {
      const response = await this.axiosInstance.get(`/api/collection/${collectionId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching collection:", error);
      throw error;
    }
  }

  async createCollection(
    collection: Omit<Collection, "_id" | "size" | "createdAt">
  ): Promise<Collection> {
    try {
      const response = await this.axiosInstance.post("/api/collection", collection);
      return response.data;
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
      const response = await this.axiosInstance.patch(`/api/collection/${collectionId}`, updates);
      return response.data;
    } catch (error) {
      console.error("Error updating collection:", error);
      throw error;
    }
  }

  async deleteCollection(collectionId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/api/collection/${collectionId}`);
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
      const response = await this.axiosInstance.post(
        `/api/collection/${collectionId}/request`,
        request
      );
      return response.data;
    } catch (error) {
      console.error("Error creating request:", error);
      // Return mock data for development
      return {
        _id: Date.now().toString(),
        ...request,
        collectionId,
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
      const response = await this.axiosInstance.patch(
        `/api/collection/${collectionId}/request/${requestId}`,
        updates
      );
      return response.data;
    } catch (error) {
      console.error("Error updating request:", error);
      throw error;
    }
  }

  async deleteRequest(collectionId: string, requestId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/api/collection/${collectionId}/request/${requestId}`);
    } catch (error) {
      console.error("Error deleting request:", error);
      throw error;
    }
  }

  // Search Collections
  async searchCollections(query: string): Promise<Collection[]> {
    try {
      const response = await this.axiosInstance.get(`/api/collection/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error("Error searching collections:", error);
      throw error;
    }
  }

  async searchEnvironments(query: string): Promise<Environment[]> {
    try {
      const response = await this.axiosInstance.get(`/api/environment/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error("Error searching environment:", error);
      throw error;
    }
  }

  // Environments API
  async getEnvironments(): Promise<Environment[]> {
    try {
      const response = await this.axiosInstance.get("/api/environment");
      return response.data;
    } catch (error) {
      console.error("Error fetching environments:", error);
      throw error;
    }
  }

  async createEnvironment(
    environment: Omit<Environment, "_id" | "createdAt" | "isActive">
  ): Promise<Environment> {
    try {
      const response = await this.axiosInstance.post("/api/environment", environment);
      return response.data;
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
      const response = await this.axiosInstance.patch(`/api/environment/${environmentId}`, updates);
      return response.data;
    } catch (error) {
      console.error("Error updating environment:", error);
      throw error;
    }
  }

  async deleteEnvironment(environmentId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/api/environment/${environmentId}`);
    } catch (error) {
      console.error("Error deleting environment:", error);
      throw error;
    }
  }

  async importPmCollection(file: File): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('collection', file);
      
      await this.axiosInstance.post('/api/collection/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('Error importing collection:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
