/**
 * Integration tests for authentication flows
 * Tests the complete auth lifecycle: publish -> update -> delete
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { handlePublish } from '../handlers/publish';
import { handleUpdateCard } from '../handlers/update-card';
import { handleDeleteCard } from '../handlers/delete-card';
import { handleGetCard } from '../handlers/get-card';
import { createTestEnv, createCorsHeaders, createTestCard, createAuthenticatedRequest } from './helpers/test-env';
import { generateOwnerToken, hashToken } from '../utils/auth';
import type { Env } from '../types';

describe('Auth Integration Tests', () => {
  let env: Env;
  let corsHeaders: Record<string, string>;

  beforeEach(() => {
    env = createTestEnv();
    corsHeaders = createCorsHeaders();
  });

  describe('Publish Flow', () => {
    it('should generate and return token when publishing a new card', async () => {
      const cardData = createTestCard();
      const request = new Request('http://localhost/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      const response = await handlePublish(request, env, corsHeaders);
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.id).toBeDefined();
      expect(result.owner_token).toBeDefined();
      expect(result.token_warning).toBeDefined();
      expect(typeof result.owner_token).toBe('string');
      expect(result.owner_token.length).toBeGreaterThan(0);
    });

    it('should require authentication when republishing an existing card', async () => {
      // First, publish a card
      const cardData = createTestCard({ id: 'test-card-123' });
      const publishRequest = new Request('http://localhost/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      const publishResponse = await handlePublish(publishRequest, env, corsHeaders);
      expect(publishResponse.status).toBe(200);
      const publishedCard = await publishResponse.json();
      // Token is returned but not used in this test
      expect(publishedCard.owner_token).toBeDefined();

      // Try to republish without token
      const republishRequest = new Request('http://localhost/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cardData, profile: { ...cardData.profile, bio: 'Updated bio' } }),
      });

      const republishResponse = await handlePublish(republishRequest, env, corsHeaders);
      expect(republishResponse.status).toBe(401);
      const error = await republishResponse.json();
      expect(error.error).toBe('Unauthorized');
      expect(error.message).toContain('authentication');
    });

    it('should allow republishing with valid token', async () => {
      // First, publish a card
      const cardData = createTestCard({ id: 'test-card-456' });
      const publishRequest = new Request('http://localhost/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      const publishResponse = await handlePublish(publishRequest, env, corsHeaders);
      const publishedCard = await publishResponse.json();
      const token = publishedCard.owner_token;

      // Republish with token
      const updatedCardData = {
        ...cardData,
        profile: { ...cardData.profile, bio: 'Updated bio via republish' },
      };
      const republishRequest = createAuthenticatedRequest(
        'http://localhost/api/publish',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCardData),
        },
        token
      );

      const republishResponse = await handlePublish(republishRequest, env, corsHeaders);
      expect(republishResponse.status).toBe(200);
      const result = await republishResponse.json();
      expect(result.profile.bio).toBe('Updated bio via republish');
      // Should not return token again for existing cards
      expect(result.owner_token).toBeUndefined();
    });

    it('should generate new token for legacy card being republished', async () => {
      // Create a legacy card (no owner_token_hash)
      const cardData = createTestCard({ id: 'legacy-card-123' });
      
      // Manually insert a legacy card into the database
      const token = await generateOwnerToken();
      const secret = env.AUTH_SECRET || 'test-secret-key-for-testing-only';
      await hashToken(token, secret); // Hash is computed but not stored for legacy cards
      
      // Insert card with NULL token hash (simulating legacy card)
      await env.DB.prepare(
        `INSERT INTO cards (
          id, username, profile_json, services_json, social_json, links_json,
          ratings_json, testimonials_json, client_photos_json, badges_json,
          certifications_json, recommendations_json, location_json, referral_code,
          published_at, updated_at, is_active, is_featured, subscription_tier,
          free_period_end, updates_enabled_until, endorsement_count, can_update, payment_status, owner_token_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          cardData.id || 'legacy-card-123',
          null,
          JSON.stringify(cardData.profile),
          JSON.stringify(cardData.services || []),
          JSON.stringify(cardData.social || []),
          JSON.stringify(cardData.links || []),
          JSON.stringify(cardData.ratings || []),
          JSON.stringify(cardData.testimonials || []),
          JSON.stringify(cardData.client_photos || []),
          JSON.stringify(cardData.badges || []),
          JSON.stringify(cardData.certifications || []),
          JSON.stringify(cardData.recommendations || { count: 0, recent: [] }),
          cardData.location ? JSON.stringify(cardData.location) : null,
          'LEGACY123',
          Date.now(),
          Date.now(),
          1,
          0,
          'free',
          Date.now() + 30 * 24 * 60 * 60 * 1000,
          Date.now() + 30 * 24 * 60 * 60 * 1000,
          0,
          1,
          'none',
          null // NULL token hash = legacy card
        )
        .run();

      // Republish legacy card
      const republishRequest = new Request('http://localhost/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cardData, profile: { ...cardData.profile, bio: 'Upgraded legacy card' } }),
      });

      const republishResponse = await handlePublish(republishRequest, env, corsHeaders);
      expect(republishResponse.status).toBe(200);
      const result = await republishResponse.json();
      expect(result.owner_token).toBeDefined();
      expect(result.token_warning).toBeDefined();
    });
  });

  describe('Update Flow', () => {
    it('should allow updating card with valid token', async () => {
      // Publish a card
      const cardData = createTestCard({ id: 'update-test-card' });
      const publishRequest = new Request('http://localhost/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      const publishResponse = await handlePublish(publishRequest, env, corsHeaders);
      const publishedCard = await publishResponse.json();
      const token = publishedCard.owner_token;

      // Update with valid token
      const updateData = {
        profile: { ...cardData.profile, bio: 'Updated bio' },
      };
      const updateRequest = createAuthenticatedRequest(
        `http://localhost/api/card/${publishedCard.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        },
        token
      );

      const updateResponse = await handleUpdateCard(publishedCard.id, updateRequest, env, corsHeaders);
      expect(updateResponse.status).toBe(200);
      const updatedCard = await updateResponse.json();
      expect(updatedCard.profile.bio).toBe('Updated bio');
    });

    it('should reject update without token', async () => {
      // Publish a card
      const cardData = createTestCard({ id: 'no-token-update-test' });
      const publishRequest = new Request('http://localhost/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      const publishResponse = await handlePublish(publishRequest, env, corsHeaders);
      const publishedCard = await publishResponse.json();

      // Try to update without token
      const updateRequest = new Request(`http://localhost/api/card/${publishedCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: { ...cardData.profile, bio: 'Should fail' } }),
      });

      const updateResponse = await handleUpdateCard(publishedCard.id, updateRequest, env, corsHeaders);
      expect(updateResponse.status).toBe(401);
      const error = await updateResponse.json();
      expect(error.error).toBe('Unauthorized');
    });

    it('should reject update with invalid token', async () => {
      // Publish a card
      const cardData = createTestCard({ id: 'invalid-token-test' });
      const publishRequest = new Request('http://localhost/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      const publishResponse = await handlePublish(publishRequest, env, corsHeaders);
      const publishedCard = await publishResponse.json();

      // Try to update with wrong token
      const wrongToken = 'wrong-token-12345';
      const updateRequest = createAuthenticatedRequest(
        `http://localhost/api/card/${publishedCard.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: { ...cardData.profile, bio: 'Should fail' } }),
        },
        wrongToken
      );

      const updateResponse = await handleUpdateCard(publishedCard.id, updateRequest, env, corsHeaders);
      expect(updateResponse.status).toBe(401);
      const error = await updateResponse.json();
      expect(error.error).toBe('Unauthorized');
    });

    it('should reject update with token from different card', async () => {
      // Publish two cards
      const card1Data = createTestCard({ id: 'card-1' });
      const card2Data = createTestCard({ id: 'card-2' });

      const publish1Request = new Request('http://localhost/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card1Data),
      });
      const publish2Request = new Request('http://localhost/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card2Data),
      });

      const publish1Response = await handlePublish(publish1Request, env, corsHeaders);
      const publish2Response = await handlePublish(publish2Request, env, corsHeaders);

      const card1 = await publish1Response.json();
      const card2 = await publish2Response.json();

      // Try to update card2 with card1's token
      const updateRequest = createAuthenticatedRequest(
        `http://localhost/api/card/${card2.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: { ...card2Data.profile, bio: 'Unauthorized update' } }),
        },
        card1.owner_token
      );

      const updateResponse = await handleUpdateCard(card2.id, updateRequest, env, corsHeaders);
      expect(updateResponse.status).toBe(401);
      const error = await updateResponse.json();
      expect(error.error).toBe('Unauthorized');
    });
  });

  describe('Delete Flow', () => {
    it('should allow deleting card with valid token', async () => {
      // Publish a card
      const cardData = createTestCard({ id: 'delete-test-card' });
      const publishRequest = new Request('http://localhost/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      const publishResponse = await handlePublish(publishRequest, env, corsHeaders);
      const publishedCard = await publishResponse.json();
      const token = publishedCard.owner_token;

      // Verify card exists
      const getResponse = await handleGetCard(publishedCard.id, env, corsHeaders);
      expect(getResponse.status).toBe(200);

      // Delete with valid token
      const deleteRequest = createAuthenticatedRequest(
        `http://localhost/api/card/${publishedCard.id}`,
        { method: 'DELETE' },
        token
      );

      const deleteResponse = await handleDeleteCard(publishedCard.id, deleteRequest, env, corsHeaders);
      expect(deleteResponse.status).toBe(200);
      const result = await deleteResponse.json();
      expect(result.success).toBe(true);

      // Verify card is soft-deleted (is_active = 0)
      // Note: get-card might still return it, but it should be marked inactive
    });

    it('should reject delete without token', async () => {
      // Publish a card
      const cardData = createTestCard({ id: 'no-token-delete-test' });
      const publishRequest = new Request('http://localhost/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      const publishResponse = await handlePublish(publishRequest, env, corsHeaders);
      const publishedCard = await publishResponse.json();

      // Try to delete without token
      const deleteRequest = new Request(`http://localhost/api/card/${publishedCard.id}`, {
        method: 'DELETE',
      });

      const deleteResponse = await handleDeleteCard(publishedCard.id, deleteRequest, env, corsHeaders);
      expect(deleteResponse.status).toBe(401);
      const error = await deleteResponse.json();
      expect(error.error).toBe('Unauthorized');
    });

    it('should reject delete with invalid token', async () => {
      // Publish a card
      const cardData = createTestCard({ id: 'invalid-token-delete-test' });
      const publishRequest = new Request('http://localhost/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      const publishResponse = await handlePublish(publishRequest, env, corsHeaders);
      const publishedCard = await publishResponse.json();

      // Try to delete with wrong token
      const wrongToken = 'wrong-token-12345';
      const deleteRequest = createAuthenticatedRequest(
        `http://localhost/api/card/${publishedCard.id}`,
        { method: 'DELETE' },
        wrongToken
      );

      const deleteResponse = await handleDeleteCard(publishedCard.id, deleteRequest, env, corsHeaders);
      expect(deleteResponse.status).toBe(401);
      const error = await deleteResponse.json();
      expect(error.error).toBe('Unauthorized');
    });
  });

  describe('Complete Auth Lifecycle', () => {
    it('should handle complete lifecycle: publish -> update -> delete', async () => {
      // 1. Publish a new card
      const cardData = createTestCard({ id: 'lifecycle-test-card' });
      const publishRequest = new Request('http://localhost/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      const publishResponse = await handlePublish(publishRequest, env, corsHeaders);
      expect(publishResponse.status).toBe(200);
      const publishedCard = await publishResponse.json();
      const token = publishedCard.owner_token;
      expect(token).toBeDefined();

      // 2. Update the card
      const updateData = {
        profile: { ...cardData.profile, bio: 'Lifecycle updated bio' },
      };
      const updateRequest = createAuthenticatedRequest(
        `http://localhost/api/card/${publishedCard.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        },
        token
      );

      const updateResponse = await handleUpdateCard(publishedCard.id, updateRequest, env, corsHeaders);
      expect(updateResponse.status).toBe(200);
      const updatedCard = await updateResponse.json();
      expect(updatedCard.profile.bio).toBe('Lifecycle updated bio');

      // 3. Delete the card
      const deleteRequest = createAuthenticatedRequest(
        `http://localhost/api/card/${publishedCard.id}`,
        { method: 'DELETE' },
        token
      );

      const deleteResponse = await handleDeleteCard(publishedCard.id, deleteRequest, env, corsHeaders);
      expect(deleteResponse.status).toBe(200);
      const deleteResult = await deleteResponse.json();
      expect(deleteResult.success).toBe(true);
    });

    it('should maintain token consistency across multiple operations', async () => {
      // Publish a card
      const cardData = createTestCard({ id: 'token-consistency-test' });
      const publishRequest = new Request('http://localhost/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      const publishResponse = await handlePublish(publishRequest, env, corsHeaders);
      const publishedCard = await publishResponse.json();
      const token = publishedCard.owner_token;

      // Perform multiple updates with the same token
      for (let i = 0; i < 3; i++) {
        const updateData = {
          profile: { ...cardData.profile, bio: `Update ${i + 1}` },
        };
        const updateRequest = createAuthenticatedRequest(
          `http://localhost/api/card/${publishedCard.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          },
          token
        );

        const updateResponse = await handleUpdateCard(publishedCard.id, updateRequest, env, corsHeaders);
        expect(updateResponse.status).toBe(200);
      }

      // Token should still work for delete
      const deleteRequest = createAuthenticatedRequest(
        `http://localhost/api/card/${publishedCard.id}`,
        { method: 'DELETE' },
        token
      );

      const deleteResponse = await handleDeleteCard(publishedCard.id, deleteRequest, env, corsHeaders);
      expect(deleteResponse.status).toBe(200);
    });
  });

  describe('Error Cases', () => {
    it('should handle missing Authorization header', async () => {
      const cardData = createTestCard({ id: 'no-auth-header-test' });
      const publishRequest = new Request('http://localhost/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      const publishResponse = await handlePublish(publishRequest, env, corsHeaders);
      const publishedCard = await publishResponse.json();

      // Try update without Authorization header
      const updateRequest = new Request(`http://localhost/api/card/${publishedCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: { ...cardData.profile, bio: 'Should fail' } }),
      });

      const updateResponse = await handleUpdateCard(publishedCard.id, updateRequest, env, corsHeaders);
      expect(updateResponse.status).toBe(401);
    });

    it('should handle malformed Authorization header', async () => {
      const cardData = createTestCard({ id: 'malformed-auth-test' });
      const publishRequest = new Request('http://localhost/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      const publishResponse = await handlePublish(publishRequest, env, corsHeaders);
      const publishedCard = await publishResponse.json();

      // Try update with malformed header
      const updateRequest = new Request(`http://localhost/api/card/${publishedCard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'InvalidFormat token-123', // Not "Bearer token"
        },
        body: JSON.stringify({ profile: { ...cardData.profile, bio: 'Should fail' } }),
      });

      const updateResponse = await handleUpdateCard(publishedCard.id, updateRequest, env, corsHeaders);
      expect(updateResponse.status).toBe(401);
    });

    it('should handle non-existent card ID', async () => {
      const token = await generateOwnerToken();
      const updateRequest = createAuthenticatedRequest(
        'http://localhost/api/card/non-existent-id',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: { bio: 'Should fail' } }),
        },
        token
      );

      const updateResponse = await handleUpdateCard('non-existent-id', updateRequest, env, corsHeaders);
      expect(updateResponse.status).toBe(404);
    });
  });
});

