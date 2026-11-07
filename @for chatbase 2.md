# CHATBASE MASTER PROMPT 2.0
## Advanced Messaging Engine, Platform Policies, Missing Features, Backend, Security and Production Readiness

### PROJECT IDENTITY

Application: ChatBase  
Creator: HarshGuruJi  
Official website: https://webguruji.online  
Web application: https://chat.webguruji.online  
Platforms: Android application and responsive web application

This prompt extends the existing ChatBase Master Prompt. Do not discard or contradict the previous specification. Merge both prompts into one coherent implementation plan.

The primary goal is to create a high-performance, real-time social messaging platform with a premium interface, reliable backend, configurable web restrictions, expanded Android functionality, and consistent branding.

Do not create a static demo. Build real, testable features using the existing project architecture and backend wherever possible.

# 1. PLATFORM CAPABILITY MATRIX

Create a central platform capability configuration so Android and web can have different product policies without duplicating the entire application.

Every feature must declare:
- Whether it is supported on Android
- Whether it is supported on web
- Whether authentication is required
- Whether a permission is required
- Whether a server-side restriction applies
- Whether an administrator can configure its availability
- Whether the feature requires a particular backend integration

Maintain a documented capability matrix.

Examples:

| Feature | Android | Web |
|---|---|---|
| Text messaging | Enabled | Enabled |
| Emoji and reactions | Enabled | Enabled |
| Image sharing | Configurable limits | Configurable limits |
| Video sharing | Configurable limits | Configurable limits |
| Voice messages | If supported | If supported |
| Location sharing | Permission-based | Consent-based |
| Push notifications | Supported integration | Browser permission required |
| File attachments | Configurable policy | Configurable stricter policy |
| Account and privacy settings | Supported | Supported |
| Blocking and reporting | Supported | Supported |

These are policy examples, not a claim that every integration already exists.

IMPORTANT:
- A feature being available on Android does not automatically make it safe or appropriate without limits.
- Web-specific restrictions must be enforced by the server wherever relevant.
- Frontend configuration must never be the only security boundary.
- Do not silently remove existing working features.
- Clearly explain unavailable features to users.

# 2. ADVANCED REAL-TIME CHAT ENGINE

Implement a reliable conversation engine supporting the following capabilities where technically supported.

### Message types

- Plain text
- Emoji and Unicode
- Image attachments
- Video attachments
- Voice messages
- Document attachments
- Replies to messages
- Message reactions
- Message editing
- Message deletion
- Forwarding
- Shared links with safe previews
- Contact cards where appropriate
- System messages for group events

Each message should have a stable ID, conversation ID, sender ID, server timestamp, message type, delivery state, and applicable attachment metadata.

Validate every incoming and outgoing message.

Do not treat a frontend-generated status as proof of server delivery.

### Message status

Implement truthful message states:
- Sending
- Sent
- Delivered, if acknowledged by the recipient's device or the actual delivery infrastructure
- Read, if supported and permitted
- Failed
- Retrying

Use clear visual indicators and accessible labels.

### Message editing

If editing is enabled:
- Allow the sender to edit eligible messages.
- Store the edit timestamp.
- Prevent unauthorized editing.
- Handle concurrent changes safely.
- Show an edited indicator.
- Define a reasonable edit policy and document it.

### Message deletion

Support:
- Delete for me
- Delete for everyone, when permitted
- Conversation deletion or clearing
- Optional message expiration

Use server-side authorization and appropriate audit events for sensitive operations.

Explain that deleting a message from the application cannot guarantee removal of screenshots, downloaded copies, or previously exported data.

### Reply and forwarding

Allow replies to reference the original message ID without duplicating the original attachment unnecessarily.

When forwarding, retain appropriate attribution or context and respect visibility and privacy permissions.

### Search inside conversations

Provide:
- Search by message text
- Search by sender where permitted
- Date-based filtering
- Attachment filtering
- Highlighted matches
- Jump to message

Use indexed server-side search or an appropriate search service for large histories. Apply conversation membership checks to every result.

# 3. HIGH-PERFORMANCE MESSAGING ARCHITECTURE

Inspect the existing backend before selecting or replacing technologies.

If starting from scratch, choose an architecture suitable for real-time messaging, persistent data, media uploads, and horizontal scaling.

### Connection management

- Use a suitable real-time transport, such as WebSockets or a managed realtime service.
- Authenticate connections.
- Authorize every conversation subscription.
- Reconnect with exponential backoff and jitter.
- Use heartbeats where required.
- Handle expired credentials safely.
- Clean up inactive subscriptions.
- Prevent duplicate listeners.
- Fall back gracefully when realtime connectivity is unavailable.

### Consistency and delivery

- Assign stable unique message IDs.
- Use server-authoritative timestamps.
- Make retries idempotent.
- Deduplicate repeated events.
- Preserve conversation ordering.
- Handle out-of-order delivery.
- Synchronize unread counts.
- Reconcile optimistic UI updates with the server.
- Support paginated history loading.
- Recover missed events after reconnecting.

### Database design

Audit and optimize the existing schema before introducing new tables.

Potential entities include:
- Users
- Profiles
- Conversations
- Conversation members
- Messages
- Attachments
- Message receipts
- Reactions
- Follows
- Blocks
- Reports
- Notifications
- User settings
- Sessions
- Administrative audit events

Add indexes for frequently queried fields, including conversation membership, message chronology, unread state, and supported search operations.

Use transactions or equivalent consistency mechanisms for related state changes.

Do not store large media blobs directly in ordinary message records if object storage is more appropriate.

### Scaling

- Separate media storage from message metadata.
- Paginate all potentially large lists.
- Limit query result sizes.
- Use appropriate caching.
- Reduce unnecessary broadcasts.
- Partition or shard data only when justified by measurements.
- Introduce background workers for expensive tasks where useful.
- Use queue-based processing for suitable notifications and media jobs.
- Monitor database connection pools and realtime connection counts.

Do not introduce complicated infrastructure without a demonstrated need.

# 4. ADVANCED MEDIA SHARING

Create a shared media pipeline for Android and web, with configurable limits.

### Upload flow

1. User selects a file.
2. Client checks the configured size and permitted type.
3. Server authorizes the upload.
4. Upload uses a secure, limited-duration mechanism where appropriate.
5. The server validates file signatures and content.
6. A scanning or moderation process runs where applicable.
7. The server records validated attachment metadata.
8. The message becomes available according to the product's delivery policy.

Never trust file extensions or client-provided MIME types alone.

### Configurable limits

Allow the administrator to configure:
- Maximum image size
- Maximum video size
- Maximum document size
- Maximum voice-message duration
- Allowed attachment types
- Web-specific attachment restrictions
- Per-user upload quotas
- Rate limits

Use sensible defaults suitable for the existing infrastructure and device capabilities.

Do not advertise a file size or duration limit unless the application enforces it.

### Media optimization

- Resize image previews.
- Generate thumbnails where appropriate.
- Avoid downloading full-resolution images for list previews.
- Use adaptive or efficient media formats when supported.
- Load attachments on demand.
- Display upload progress.
- Support cancellation and safe retries.
- Handle interrupted uploads.
- Avoid loading all conversation media at once.

### Media viewer

Provide a consistent viewer with:
- Image zoom
- Video playback controls
- Voice playback controls
- File details
- Download actions when permitted
- Close and back navigation
- Accessible controls
- Appropriate loading and error states

Never execute uploaded files automatically.

# 5. VOICE MESSAGING AND OPTIONAL CALLING

### Voice messages

If microphone access and a suitable recording implementation are available:
- Request microphone permission when the user starts recording.
- Display recording duration.
- Provide cancel, preview, and send controls where supported.
- Enforce the configured duration limit.
- Handle interrupted recordings.
- Stop microphone capture when appropriate.
- Avoid retaining temporary audio unnecessarily.

Support waveform visualization only if it can be implemented without harming performance.

### Audio playback

- Provide play and pause controls.
- Show playback progress.
- Support reasonable playback speeds where supported.
- Handle interrupted playback.
- Respect operating-system audio focus where relevant.
- Avoid overlapping playback unexpectedly.

### Voice and video calls

Do not display functional-looking call buttons unless actual calling infrastructure is implemented.

If calling is included, use a suitable real-time media solution, permission handling, secure signaling, connection recovery, and clear call states.

# 6. GROUP CHATS

Implement group conversations if required by the product scope.

Potential features:
- Create a group
- Set group name and avatar
- Add and remove members according to permissions
- Group administrator roles
- Leave group
- Group descriptions
- Group notification preferences
- Reply and reactions
- Member list
- Group invitation links, if supported
- Group message history permissions

Every membership change must be validated on the server.

Prevent unauthorized users from reading group history or sending messages.

Provide clear ownership-transfer behavior if a group administrator leaves.

# 7. PRIVACY AND SOCIAL CONTROLS

Complete the privacy experience with the following capabilities where supported:

- Block and unblock users
- Mute conversations
- Restrict message requests
- Manage follow requests
- Hide online status
- Hide last-seen status
- Manage read receipts
- Control profile discoverability
- Manage location sharing
- Report abuse
- Manage active sessions where available
- Export or delete account data where required and supported

Privacy controls must affect backend behavior, not just the interface.

Do not reveal blocked users' private activity or location.

Use consent-based location sharing with an explicit explanation, limited purpose, and easy revocation.

Do not collect precise location continuously in the background without a clearly justified feature and the required permissions.

# 8. WEB PLATFORM RESTRICTION ENGINE

Build a dedicated policy engine for web-specific product limits.

Examples of configurable restrictions:
- Smaller attachment size limits
- Restricted attachment types
- Disabled optional features
- Limited upload frequency
- Limited guest access
- Additional verification for sensitive actions
- Browser-specific capability checks
- Restricted administrative actions
- Configurable message-request behavior

Policies must be:
- Centralized
- Versioned where appropriate
- Documented
- Tested
- Applied consistently
- Enforced by the backend when security matters

The client may use server-provided policy information to hide unavailable controls, but the backend must independently reject unauthorized requests.

When a feature is unavailable, show a concise explanation instead of a broken button.

Do not use user-agent detection as the sole security mechanism.

Do not create a hidden unrestricted endpoint that bypasses web restrictions.

# 9. ANDROID FEATURE CONFIGURATION

Allow Android to use a broader set of product capabilities when those capabilities are implemented and supported.

Possible differences:
- Native notification support
- System share sheet
- Platform media picker
- Voice recording
- Background-safe upload continuation
- Native navigation and keyboard behavior
- Device-specific caching
- Camera or microphone integration
- Platform-supported biometric reauthentication, if required

Request permissions only when needed.

Use secure operating-system storage for sensitive credentials.

Do not assume Android is exempt from server-side privacy, security, abuse prevention, or legal requirements.

Do not secretly access device files, contacts, camera, microphone, or location.

# 10. CONFIGURABLE ADMINISTRATOR CONTROL CENTER

Extend the existing administrator panel instead of replacing it.

Create a Platform Policies section containing:

### Feature management
- Enable or disable supported features
- Configure Android availability
- Configure web availability
- Define minimum supported application versions where appropriate
- Define rollout percentages where useful
- Roll out changes gradually when practical

### Upload policies
- Maximum file sizes by platform
- Allowed file types
- Voice-message duration
- Upload quotas
- Rate limits
- Storage limits

### Messaging policies
- Message expiration defaults
- Message edit policy
- Delete-for-everyone policy
- Message request behavior
- Group creation permissions
- Attachment restrictions

### Security and moderation
- Rate-limit configuration
- Abuse report queue
- User restrictions
- Account suspension workflows
- Audit events
- Security alert visibility

### Operational dashboard
- Active sessions
- Realtime connection health
- Message delivery latency
- Upload failure rates
- Server error rates
- Storage usage
- Queue health
- API latency

Display actual measured data. Never generate fake dashboard statistics.

### Administrative safety

- Require proper administrator authentication.
- Enforce roles on the backend.
- Validate every configuration change.
- Record who changed sensitive policies and when.
- Keep a history of policy changes.
- Support rollback where appropriate.
- Never expose privileged credentials to the browser.
- Require confirmation for destructive operations.

# 11. NOTIFICATION DELIVERY

Implement a notification pipeline for supported events.

Potential channels:
- In-app notifications
- Android push notifications
- Browser push notifications
- Email notifications, if configured

Requirements:
- Respect notification preferences.
- Respect operating-system permissions.
- Prevent duplicate event delivery where possible.
- Handle expired push tokens.
- Avoid leaking private message contents in notifications when previews are disabled.
- Retry transient failures safely.
- Avoid sending notifications for blocked or unauthorized interactions.
- Record operational failures without exposing sensitive content.

Do not claim that a notification was delivered merely because it was queued.

# 12. SEARCH AND DISCOVERY PERFORMANCE

Build scalable search for:
- Usernames
- Unique user IDs
- Display names
- Conversation names
- Message history
- Attachments where supported

Use debouncing, pagination, query limits, and cancellation of obsolete requests.

Prevent enumeration of private accounts and unauthorized data discovery.

Apply the same authorization rules to search results as to direct profile or conversation requests.

Use ranking and recommendations only when they have a clear product purpose and respect user preferences.

# 13. OFFLINE SUPPORT AND SYNCHRONIZATION

Implement offline behavior carefully.

Possible capabilities:
- Cached conversation previews
- Cached recent message history
- Draft preservation
- Pending-send indicators
- Safe retry after reconnecting
- Synchronization after the connection returns

Clearly distinguish a locally queued message from a server-confirmed message.

Never show a pending message as delivered before confirmation.

Resolve conflicting updates deterministically.

Protect locally cached sensitive information and clear appropriate data on logout.

Do not promise full offline messaging unless the application can genuinely support it.

# 14. ACCOUNT LIFECYCLE AND DATA MANAGEMENT

Implement complete account workflows:

- Registration
- Verification
- Login
- Logout
- Password recovery
- Session expiration
- Account deactivation, if supported
- Account deletion
- Data export where appropriate
- Privacy preference management

Account deletion must include a documented data-retention and deletion process.

Handle backups, cached media, notification tokens, and associated records according to the applicable retention policy and legal requirements.

Do not claim that all data is immediately erased if backups or required retention periods make that inaccurate.

# 15. MODERATION, ABUSE PREVENTION, AND PLATFORM RULES

Provide transparent, configurable community and messaging rules.

Implement:
- User blocking
- Reporting
- Rate limits
- Spam detection where appropriate
- Repeated-message controls
- Upload abuse prevention
- Account restrictions
- Moderation review workflows
- Appeals or support processes where appropriate

Do not scan private content beyond what the documented policy, consent, applicable law, and product architecture permit.

Protect reports and moderation data from ordinary users.

Apply platform policies consistently without relying solely on client-side checks.

# 16. SECURITY HARDENING

Audit all major security boundaries.

Requirements:
- Server-side authorization for every protected resource
- Strong session management
- Secure password handling
- Input validation
- Safe file processing
- Upload size and rate limits
- Protection against unauthorized object access
- Protection against common injection and scripting attacks
- Secure web session and cookie configuration where applicable
- Appropriate cross-origin configuration
- Secret management
- Dependency vulnerability checks
- Privacy-aware logs
- Appropriate backup and recovery practices

For private conversations, do not allow users to retrieve messages by changing a conversation ID in a request.

Do not expose access tokens, API secrets, passwords, private keys, or sensitive server configuration in frontend code or public repositories.

If end-to-end encryption is implemented, use an established protocol and appropriate key management. Do not invent a custom cryptographic system.

# 17. ADVANCED PERFORMANCE TESTING

Test realistic usage, not just a single user on a fast connection.

Scenarios:
- One-to-one conversation
- Large message history
- Many simultaneous conversations
- Rapid incoming messages
- Intermittent network connectivity
- Large attachment uploads
- Background and foreground transitions
- Realtime reconnection
- Slow database queries
- High notification volume
- Repeated send retries

Measure:
- Initial application load
- Android cold and warm startup
- Message-send latency
- Server acknowledgement latency
- Realtime delivery latency
- Search latency
- Upload throughput
- Crash rate
- Memory usage
- CPU utilization
- Network usage
- Battery impact where measurable

Set test targets based on the expected scale and infrastructure.

Run load tests only in an authorized test environment with controlled traffic.

Report actual measurements, bottlenecks, and proposed improvements.

# 18. UI COMPLETION CHECKLIST

Ensure that every screen has all required states:

- Initial loading
- Refreshing
- Empty state
- Success feedback
- Validation error
- Network error
- Permission denied
- Authentication expired
- Offline state
- Retry action
- Disabled action
- Confirmation for destructive actions

Verify:
- Buttons have real actions.
- Settings persist.
- Dialogs and bottom sheets close correctly.
- Back navigation works.
- Keyboard does not cover the composer.
- Long names and long messages do not break layouts.
- Large text sizes remain usable.
- Desktop and mobile widths work.
- Theme changes apply consistently.
- Loading indicators do not remain indefinitely.
- No navigation route is broken.

Use the same design tokens and shared components from the original ChatBase design specification.

# 19. DEPLOYMENT AND OPERATIONS

Audit the existing deployment process before changing it.

For the web application:
- Preserve the existing domain and routing.
- Configure HTTPS.
- Verify production environment variables.
- Configure secure headers where appropriate.
- Configure CORS and cookies correctly.
- Verify the build and deployment process.
- Test direct navigation to application routes.
- Verify cache behavior and static asset versioning.

For Android:
- Verify the release build.
- Configure app signing correctly.
- Remove development-only settings from production.
- Verify permissions and manifest configuration.
- Test upgrade and session persistence behavior.
- Test on physical devices where available.

For the backend:
- Configure production secrets securely.
- Verify database migrations and backups.
- Configure monitoring and alerting.
- Test recovery procedures.
- Document rollback steps.

Never overwrite production configuration blindly.

# 20. FINAL IMPLEMENTATION ORDER

Phase 1: Audit the existing application.

Phase 2: Create the unified feature and platform capability matrix.

Phase 3: Finalize the data model and backend authorization rules.

Phase 4: Implement the realtime messaging engine.

Phase 5: Implement message types, attachments, and delivery states.

Phase 6: Complete group chats and social interactions where required.

Phase 7: Implement configurable web restrictions and Android capabilities.

Phase 8: Complete privacy, notification, and administrator controls.

Phase 9: Add offline synchronization and recovery.

Phase 10: Optimize database queries, frontend rendering, media, and network usage.

Phase 11: Run security, accessibility, regression, and performance tests.

Phase 12: Verify Android and web builds and document deployment.

Do not skip earlier dependencies simply to make the interface appear finished.

# 21. FINAL ACCEPTANCE REPORT

At completion, provide:

1. Features implemented
2. Features preserved from the existing application
3. Android-versus-web capability matrix
4. Working realtime messaging tests
5. Attachment validation results
6. Authorization and privacy test results
7. Administrator controls implemented
8. Performance measurements
9. Load-test environment and results
10. Android build status
11. Web deployment status
12. Known limitations
13. Security issues that remain unresolved
14. Required backend services or credentials
15. Next steps ordered by priority

Do not mark an untested feature as complete.

FINAL DIRECTIVE:

Deliver ChatBase as a polished, high-performance, real-world social messaging platform by HarshGuruJi. The Android and web products must share one identity, one coherent design system, and consistent core messaging behavior while supporting configurable platform-specific capabilities.

Prioritize reliable realtime messaging, excellent UI, fast performance, secure data access, configurable restrictions, truthful delivery states, and measurable quality. Preserve existing working features and data, and implement changes incrementally.