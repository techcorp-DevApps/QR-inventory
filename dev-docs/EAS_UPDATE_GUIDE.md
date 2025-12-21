# EAS Update Configuration Guide
## QR Inventory Manager

This guide explains how to set up and use EAS Update for over-the-air updates in your QR Inventory Manager app.

---

## Overview

EAS Update allows you to push JavaScript and asset updates to your users without going through the app store review process. This is perfect for:
- Bug fixes
- UI improvements
- New features (that don't require native code changes)
- Content updates

---

## Configuration Files

### 1. `app.config.ts` Changes

The following EAS Update configuration has been added:

```typescript
// EAS Update configuration
runtimeVersion: {
  policy: "appVersion"
},
updates: {
  url: "https://u.expo.dev/9ec3ebd6-eb6f-4838-9ff5-8d88196d0ac9",
  enabled: true,
  fallbackToCacheTimeout: 0,
  checkAutomatically: "ON_LOAD",
},
```

**What these settings do:**
- `runtimeVersion.policy: "appVersion"` - Uses your app version (1.0.0) as the runtime version
- `updates.url` - Points to your EAS Update server with your project ID
- `updates.enabled: true` - Enables OTA updates
- `fallbackToCacheTimeout: 0` - App launches immediately with cached update
- `checkAutomatically: "ON_LOAD"` - Checks for updates when app loads

### 2. `eas.json` Configuration

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "android": { "buildType": "apk" }
    },
    "staging": {
      "channel": "staging",
      "android": { "buildType": "apk" }
    },
    "production": {
      "channel": "production",
      "autoIncrement": true
    }
  }
}
```

**Channels explained:**
- `development` - For local development with dev client
- `preview` - Internal testing builds (APK for testers)
- `staging` - Pre-production testing (TestFlight/Play Store Beta)
- `production` - Live app store releases

---

## Setup Steps

### Step 1: Install Dependencies

```bash
# Install expo-updates (if not already installed)
npx expo install expo-updates

# Ensure EAS CLI is installed globally
npm install -g eas-cli
```

### Step 2: Login to EAS

```bash
eas login
# or check if already logged in
eas whoami
```

### Step 3: Configure Project (Already Done)

The configuration has already been added to your project. If starting fresh:

```bash
eas update:configure
```

### Step 4: Create a Build

Before publishing updates, you need at least one build with EAS Update configured:

```bash
# For internal testing (APK)
eas build --platform android --profile preview

# For staging (TestFlight/Play Store Beta)
eas build --platform android --profile staging

# For production
eas build --platform android --profile production
```

---

## Publishing Updates

### Quick Update to Preview Channel

```bash
# Make your code changes, then:
eas update --channel preview --message "Fix: Item photos not displaying"
```

### Update to Staging

```bash
eas update --channel staging --message "v1.0.1: Bug fixes and improvements"
```

### Update to Production

```bash
# Test in staging first, then:
eas update --channel production --message "v1.0.1: Critical bug fix"
```

### Republish from Staging to Production

If you've tested an update in staging and want to deploy the exact same bundle to production:

```bash
eas update:republish --destination-channel production
```

---

## Rollout Strategies

### Gradual Rollout

Roll out to a percentage of users first:

```bash
# Deploy to 10% of users
eas update --channel production --rollout-percentage 10 --message "Testing new feature"

# Increase rollout later
eas update:edit --rollout-percentage 50

# Full rollout
eas update:edit --rollout-percentage 100
```

### Rollback

If something goes wrong:

```bash
eas update:rollback --channel production
```

---

## Workflow Examples

### Bug Fix Workflow

1. **Identify bug** in production
2. **Fix locally** and test
3. **Publish to staging:**
   ```bash
   eas update --channel staging --message "Fix: QR scanner crash"
   ```
4. **Test staging build** on device
5. **Promote to production:**
   ```bash
   eas update:republish --destination-channel production
   ```

### Feature Release Workflow

1. **Develop feature** locally
2. **Create preview build** (if needed):
   ```bash
   eas build --platform android --profile preview
   ```
3. **Publish to preview:**
   ```bash
   eas update --channel preview --message "New: Bulk item import"
   ```
4. **Internal testing** with preview build
5. **Publish to staging** for broader testing
6. **Gradual rollout to production:**
   ```bash
   eas update --channel production --rollout-percentage 10
   ```

---

## Checking Update Status

### View Updates

```bash
# List recent updates
eas update:list

# View update details
eas update:view [update-id]
```

### View Branches and Channels

```bash
# List branches
eas branch:list

# List channels
eas channel:list
```

---

## Runtime Version Management

The `appVersion` policy means:
- App version `1.0.0` → Runtime version `1.0.0`
- Updates published with runtime `1.0.0` only apply to builds with version `1.0.0`

**When to increment app version:**
- Native code changes (new permissions, new native modules)
- Major feature releases that require new build
- Any changes to `app.config.ts` that affect native code

**When NOT to increment:**
- JavaScript-only changes
- Asset updates (images, fonts)
- Bug fixes in JS code

---

## Troubleshooting

### Update Not Showing

1. **Check channel matches:** Build channel must match update channel
2. **Check runtime version:** Update runtime version must match build runtime version
3. **Force close and reopen:** Updates apply after app restart
4. **Clear app cache:** In some cases, clearing app data helps

### Debug Updates

Add this to your app to check update status:

```typescript
import * as Updates from 'expo-updates';

// Check for updates manually
async function checkForUpdates() {
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch (e) {
    console.log('Error checking for updates:', e);
  }
}

// Get current update info
console.log('Update ID:', Updates.updateId);
console.log('Channel:', Updates.channel);
console.log('Runtime Version:', Updates.runtimeVersion);
```

---

## Common Commands Reference

| Command | Description |
|---------|-------------|
| `eas update --channel preview` | Publish update to preview |
| `eas update --channel production` | Publish update to production |
| `eas update:list` | List all updates |
| `eas update:rollback` | Rollback to previous update |
| `eas update:republish` | Republish to different channel |
| `eas build --profile preview` | Create preview build |
| `eas build --profile production` | Create production build |

---

## Next Steps

1. **Install expo-updates** if not already installed
2. **Create a preview build** with the new configuration
3. **Make a test change** and publish an update
4. **Verify update** loads on the preview build

```bash
# Complete setup sequence:
npx expo install expo-updates
eas build --platform android --profile preview
# After build completes and is installed:
eas update --channel preview --message "Test update"
```

---

## Resources

- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Deployment Patterns](https://docs.expo.dev/eas-update/deployment-patterns/)
- [Debugging Updates](https://docs.expo.dev/eas-update/debug/)
- [Updates API Reference](https://docs.expo.dev/versions/latest/sdk/updates/)
