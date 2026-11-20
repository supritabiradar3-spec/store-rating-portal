// backend/test-suite.js
// Comprehensive automated test suite verifying all requirements from the challenge PDF

const http = require('http');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const db = require('./config/db');

// Import Express app components
const express = require('express');
const cors = require('cors');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const storesRouter = require('./routes/stores');
const ratingsRouter = require('./routes/ratings');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/api/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/api/admin', adminRouter);
app.use('/stores', storesRouter);
app.use('/api/stores', storesRouter);
app.use('/ratings', ratingsRouter);
app.use('/api/ratings', ratingsRouter);

const TEST_PORT = 5055;
const BASE_URL = `http://localhost:${TEST_PORT}`;

let server;
let passedCount = 0;
let failedCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failedCount++;
  }
}

async function runTests() {
  console.log('========================================================');
  console.log('STARTING STORE RATING SYSTEM AUTOMATED API TEST SUITE');
  console.log('========================================================\n');

  // Track created test resource identifiers for reliable teardown
  let createdUserEmail = null;
  let createdAdminEmail = null;
  let createdOwnerEmail = null;
  let createdStoreId = null;

  server = app.listen(TEST_PORT);
  await new Promise((r) => setTimeout(r, 500));

  try {
    // ----------------------------------------------------
    // TEST 1: Role Logins & Single Login System
    // ----------------------------------------------------
    console.log('--- Test Group 1: Single Login System & Authentication ---');

    // 1.1 Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@storerating.com', password: 'Admin@999' }),
    });
    const adminData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminData.token && adminData.user.role === 'ADMIN', 'Admin login with valid credentials');
    const adminToken = adminData.token;

    // 1.2 Store Owner Login
    const ownerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.owner@storerating.com', password: 'Owner@456' }),
    });
    const ownerData = await ownerLoginRes.json();
    assert(ownerLoginRes.status === 200 && ownerData.token && ownerData.user.role === 'OWNER', 'Store Owner login with valid credentials');
    const ownerToken = ownerData.token;

    // 1.3 Normal User Login
    const userLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jessica@example.com', password: 'User@456' }),
    });
    const userData = await userLoginRes.json();
    assert(userLoginRes.status === 200 && userData.token && userData.user.role === 'USER', 'Normal User login with valid credentials');
    const userToken = userData.token;

    // 1.4 Invalid credentials rejection
    const invalidLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@storerating.com', password: 'WrongPassword@123' }),
    });
    assert(invalidLoginRes.status === 401, 'Reject login with invalid password');

    // ----------------------------------------------------
    // TEST 2: Signup & Form Validations (PDF Rules)
    // ----------------------------------------------------
    console.log('\n--- Test Group 2: Form Validations (Name 20-60, Pass 8-16 with uppercase/special, Address max 400) ---');

    // 2.1 Name < 20 chars should fail
    const shortNameRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Short Name',
        email: 'test.validation1@example.com',
        password: 'ValidPassword@123',
        address: '123 Valid Street Address, City, Country',
      }),
    });
    assert(shortNameRes.status === 400, 'Reject signup when name is less than 20 characters');

    // 2.2 Password without special character should fail
    const noSpecialPassRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alexander Hamilton Testing',
        email: 'test.validation2@example.com',
        password: 'ValidPassword123',
        address: '123 Valid Street Address, City, Country',
      }),
    });
    assert(noSpecialPassRes.status === 400, 'Reject signup when password lacks special character');

    // 2.3 Password without uppercase letter should fail
    const noUpperPassRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alexander Hamilton Testing',
        email: 'test.validation3@example.com',
        password: 'validpassword@123',
        address: '123 Valid Street Address, City, Country',
      }),
    });
    assert(noUpperPassRes.status === 400, 'Reject signup when password lacks uppercase letter');

    // 2.4 Valid registration of new Normal User
    const uniqueEmail = `test.user.${Date.now()}@example.com`;
    createdUserEmail = uniqueEmail;
    const validSignupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Samantha Elizabeth Collins',
        email: uniqueEmail,
        password: 'Collins@2026',
        address: '450 Westlake Terrace, Suite 800, City Heights',
      }),
    });
    const signupData = await validSignupRes.json();
    assert(validSignupRes.status === 201 && signupData.token && signupData.user.role === 'USER', 'Successfully register valid normal user');
    const newRegisteredUserToken = signupData.token;

    // ----------------------------------------------------
    // TEST 3: Update Password Feature
    // ----------------------------------------------------
    console.log('\n--- Test Group 3: Update Password ---');

    // 3.1 Update password with incorrect old password
    const wrongOldPassRes = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newRegisteredUserToken}`,
      },
      body: JSON.stringify({ oldPassword: 'WrongOldPass@123', newPassword: 'BrandNewPass@999' }),
    });
    assert(wrongOldPassRes.status === 400, 'Reject password update when old password is incorrect');

    // 3.2 Update password with valid credentials
    const validPassChangeRes = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newRegisteredUserToken}`,
      },
      body: JSON.stringify({ oldPassword: 'Collins@2026', newPassword: 'UpdatedPass@2026' }),
    });
    assert(validPassChangeRes.status === 200, 'Successfully update user password');

    // 3.3 Verify login with updated password
    const newPassLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'UpdatedPass@2026' }),
    });
    assert(newPassLoginRes.status === 200, 'Login successfully with newly updated password');

    // ----------------------------------------------------
    // TEST 4: System Administrator Features
    // ----------------------------------------------------
    console.log('\n--- Test Group 4: System Administrator Dashboard & Management ---');

    // 4.1 Dashboard Statistics
    const statsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const stats = await statsRes.json();
    assert(
      statsRes.status === 200 &&
      typeof stats.totalUsers === 'number' &&
      typeof stats.totalStores === 'number' &&
      typeof stats.totalRatings === 'number',
      'Admin fetches dashboard statistics (total users, stores, ratings)'
    );

    // 4.2 Admin views and filters users
    const usersListRes = await fetch(`${BASE_URL}/admin/users?role=ALL&sortBy=name&order=ASC`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersList = await usersListRes.json();
    assert(usersListRes.status === 200 && Array.isArray(usersList) && usersList.length >= 3, 'Admin views list of users with sorting');

    // 4.3 Admin views user details (including Store Owner store & rating)
    const ownerUserId = ownerData.user.id;
    const userDetailRes = await fetch(`${BASE_URL}/admin/users/${ownerUserId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const userDetail = await userDetailRes.json();
    assert(
      userDetailRes.status === 200 &&
      userDetail.isStoreOwner === true &&
      userDetail.store !== null &&
      typeof userDetail.store.averageRating === 'number',
      'Admin views Store Owner user detail including store and average rating'
    );

    // 4.4 Admin creates a new administrator account
    const newAdminEmail = `admin.deputy.${Date.now()}@storerating.com`;
    createdAdminEmail = newAdminEmail;
    const createAdminRes = await fetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Deputy Administrator Officer',
        email: newAdminEmail,
        password: 'AdminDeputy@123',
        address: '99 Federal Plaza, Executive Suite 400',
        role: 'ADMIN',
      }),
    });
    assert(createAdminRes.status === 201, 'Admin can create a new administrator account');

    // 4.5 Admin creates a new store owner and new store
    const newOwnerEmail = `new.owner.${Date.now()}@storerating.com`;
    createdOwnerEmail = newOwnerEmail;
    const createOwnerRes = await fetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Boutique Owner Katherine Pierce',
        email: newOwnerEmail,
        password: 'Katherine@123',
        address: '500 Grand Promenade, Suite 300',
        role: 'OWNER',
      }),
    });
    const newOwnerData = await createOwnerRes.json();
    assert(createOwnerRes.status === 201, 'Admin can create a new store owner user');

    // Admin creates store assigned to Katherine
    const createStoreRes = await fetch(`${BASE_URL}/admin/stores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Katherine Luxury Cosmetics Store',
        email: 'info@katherineluxury.com',
        address: '500 Grand Promenade, Luxury Arcade Level 1',
        ownerId: newOwnerData.user.id,
      }),
    });
    const newStoreData = await createStoreRes.json();
    assert(createStoreRes.status === 201 && newStoreData.store.id, 'Admin can create a new store and assign owner');
    const katherineStoreId = newStoreData.store.id;
    createdStoreId = katherineStoreId;

    // 4.6 Admin views and sorts stores
    const adminStoresRes = await fetch(`${BASE_URL}/admin/stores?sortBy=name&order=ASC`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminStores = await adminStoresRes.json();
    assert(adminStoresRes.status === 200 && adminStores.length >= 2, 'Admin views list of stores with sorting');

    // ----------------------------------------------------
    // TEST 5: Normal User Features (Browse, Search, Rate, Modify)
    // ----------------------------------------------------
    console.log('\n--- Test Group 5: Normal User Store Browsing & Rating Upsert ---');

    // 5.1 Browse & search stores
    const searchRes = await fetch(`${BASE_URL}/stores?name=Alex&address=Downtown`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const searchList = await searchRes.json();
    assert(searchRes.status === 200 && searchList.length > 0 && searchList[0].name.includes('Alex'), 'Normal user searches stores by name and address');

    // 5.2 Submit new rating (1 to 5) for Katherine's store
    const submitRatingRes = await fetch(`${BASE_URL}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ storeId: katherineStoreId, value: 5 }),
    });
    const submitRatingData = await submitRatingRes.json();
    assert(
      submitRatingRes.status === 200 &&
      submitRatingData.value === 5 &&
      submitRatingData.storeOverallRating === 5.0 &&
      submitRatingData.totalRatings === 1,
      'Normal user submits a 5-star rating for a store'
    );

    // 5.3 Modify existing rating (prevent multiple ratings, test upsert)
    const modifyRatingRes = await fetch(`${BASE_URL}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ storeId: katherineStoreId, value: 4 }),
    });
    const modifyRatingData = await modifyRatingRes.json();
    assert(
      modifyRatingRes.status === 200 &&
      modifyRatingData.value === 4 &&
      modifyRatingData.totalRatings === 1, // Still 1 rating, updated not duplicated!
      'Normal user modifies submitted rating (upsert prevents duplicate ratings)'
    );

    // 5.4 Reject invalid rating (< 1 or > 5 or non-integer)
    const invalidRatingRes = await fetch(`${BASE_URL}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ storeId: katherineStoreId, value: 6 }),
    });
    assert(invalidRatingRes.status === 400, 'Reject rating outside 1 to 5 range');

    // ----------------------------------------------------
    // TEST 6: Store Owner Dashboard
    // ----------------------------------------------------
    console.log('\n--- Test Group 6: Store Owner Dashboard ---');

    // 6.1 Katherine logs in to view her dashboard
    const katherineLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newOwnerEmail, password: 'Katherine@123' }),
    });
    const katherineData = await katherineLoginRes.json();
    const katherineToken = katherineData.token;

    const ownerDashRes = await fetch(`${BASE_URL}/stores/owner/dashboard`, {
      headers: { Authorization: `Bearer ${katherineToken}` },
    });
    const ownerDash = await ownerDashRes.json();
    assert(
      ownerDashRes.status === 200 &&
      ownerDash.hasStore === true &&
      ownerDash.store.name === 'Katherine Luxury Cosmetics Store' &&
      ownerDash.averageRating === 4.0 &&
      ownerDash.totalRatings === 1 &&
      ownerDash.ratings.length === 1 &&
      ownerDash.ratings[0].userName === 'Jessica Maria Martinez',
      'Store Owner views average rating and list of users who submitted ratings'
    );

    // 6.2 Multi-store Owner Dashboard: Alex Johnson owns Store ID 1 and Store ID 8
    const alexLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.owner@storerating.com', password: 'Owner@456' }),
    });
    const alexData = await alexLoginRes.json();
    const alexToken = alexData.token;

    // 6.2.1 Alex views default dashboard (Store ID 1: Alex Downtown Supermarket)
    const alexDefaultDashRes = await fetch(`${BASE_URL}/stores/owner/dashboard`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    const alexDefaultDash = await alexDefaultDashRes.json();
    assert(
      alexDefaultDashRes.status === 200 &&
      alexDefaultDash.hasStore === true &&
      Array.isArray(alexDefaultDash.stores) &&
      alexDefaultDash.stores.length >= 2 &&
      alexDefaultDash.selectedStoreId === 1 &&
      alexDefaultDash.store.name === 'Alex Downtown Supermarket' &&
      alexDefaultDash.averageRating === 4.0 &&
      alexDefaultDash.ratings.some((r) => r.userName === 'Jessica Maria Martinez'),
      'Multi-store owner defaults to Store ID 1 with Jessica 4-star rating'
    );

    // 6.2.2 Alex switches to Store ID 8 (Suprita Test Shopping Store)
    const alexStore8DashRes = await fetch(`${BASE_URL}/stores/owner/dashboard?storeId=8`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    const alexStore8Dash = await alexStore8DashRes.json();
    assert(
      alexStore8DashRes.status === 200 &&
      alexStore8Dash.hasStore === true &&
      alexStore8Dash.selectedStoreId === 8 &&
      alexStore8Dash.store.name === 'Suprita Test Shopping Store' &&
      alexStore8Dash.averageRating === 5.0 &&
      alexStore8Dash.totalRatings === 1 &&
      alexStore8Dash.ratings.length === 1 &&
      alexStore8Dash.ratings[0].userName === 'Priya Sharma Testing Account' &&
      alexStore8Dash.ratings[0].value === 5,
      'Multi-store owner switches to Store ID 8 with Priya 5-star rating'
    );

    // 6.2.3 Alex cannot access a store that belongs to another owner (Security / Isolation)
    const unauthorizedStoreRes = await fetch(`${BASE_URL}/stores/owner/dashboard?storeId=${katherineStoreId}`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    assert(
      unauthorizedStoreRes.status === 403,
      'Store owner cannot access another owner store dashboard (403 Forbidden)'
    );

    // ----------------------------------------------------
    // TEST 7: Role-Based Access Control (RBAC) & Security
    // ----------------------------------------------------
    console.log('\n--- Test Group 7: Role-Based Access Control & Security ---');

    // 7.1 Normal user cannot access Admin endpoints
    const forbiddenAdminRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(forbiddenAdminRes.status === 403, 'Normal user receives 403 Forbidden on Admin endpoints');

    // 7.2 Normal user cannot access Store Owner dashboard
    const forbiddenOwnerRes = await fetch(`${BASE_URL}/stores/owner/dashboard`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(forbiddenOwnerRes.status === 403, 'Normal user receives 403 Forbidden on Owner dashboard');

    // 7.3 Unauthenticated request blocked
    const unauthRes = await fetch(`${BASE_URL}/admin/users`);
    assert(unauthRes.status === 401, 'Unauthenticated request receives 401 Unauthorized');

    console.log('\n========================================================');
    console.log(`TEST SUITE RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('========================================================');
  } catch (error) {
    console.error('Test execution error:', error);
    failedCount++;
  } finally {
    // Teardown: Safely clean up all test resources created during this run (even if tests fail)
    try {
      console.log('\n--- Teardown: Cleaning up test artifacts ---');
      if (createdStoreId) {
        await db.query('DELETE FROM ratings WHERE store_id = ?', [createdStoreId]);
        await db.query('DELETE FROM stores WHERE id = ?', [createdStoreId]);
      }

      const emailsToDelete = [createdUserEmail, createdAdminEmail, createdOwnerEmail].filter(Boolean);
      // Guarantee demo accounts are never deleted under any circumstance
      const protectedEmails = ['admin@storerating.com', 'alex.owner@storerating.com', 'jessica@example.com'];
      const safeEmailsToDelete = emailsToDelete.filter(
        (e) => !protectedEmails.includes(e.toLowerCase())
      );

      if (safeEmailsToDelete.length > 0) {
        await db.query('DELETE FROM users WHERE email IN (?)', [safeEmailsToDelete]);
      }
      console.log('  ✓ Test artifacts cleaned up successfully.');
    } catch (cleanupError) {
      console.error('  ✗ Teardown error:', cleanupError);
    }

    if (server) server.close();

    if (failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runTests();
