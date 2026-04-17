# Confirmation Dialogs - Visual Flow Diagrams

## Delete Flow

```
┌─────────────────┐
│ Delete Button   │
└────────┬────────┘
         │ onClick
         ▼
┌─────────────────────────────────────┐
│ Set deleteOpen = true               │
│ (Show DeleteConfirmation)           │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │ Delete Confirmation Dialog    │  │
│  │                               │  │
│  │ "Delete Product X?"           │  │
│  │ "This cannot be undone..."    │  │
│  │                               │  │
│  │ [Cancel]  [Delete]            │  │
│  └───────────────────────────────┘  │
└────────┬────────────────────────────┘
         │
    ┌────┴─────────┐
    │              │
    ▼              ▼
┌─────────┐   ┌──────────────────────┐
│ Cancel  │   │ Confirm Delete       │
│         │   │                      │
│ Close   │   │ Set loading = true   │
│ Dialog  │   │ API call             │
└─────────┘   │ Set loading = false  │
              │ Close Dialog         │
              │ Refresh Page         │
              └──────────────────────┘
```

## Save Flow

```
┌─────────────────┐
│ Save Button     │
└────────┬────────┘
         │ onClick
         ▼
┌─────────────────────────────────────┐
│ Set saveOpen = true                 │
│ (Show SaveConfirmation)             │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │ Save Confirmation Dialog      │  │
│  │                               │  │
│  │ "Save Store Name?"            │  │
│  │ "Are you sure you want to...?"│  │
│  │                               │  │
│  │ [Cancel]  [Save]              │  │
│  └───────────────────────────────┘  │
└────────┬────────────────────────────┘
         │
    ┌────┴──────────────┐
    │                   │
    ▼                   ▼
┌─────────┐   ┌──────────────────────┐
│ Cancel  │   │ Confirm Save         │
│         │   │                      │
│ Discard │   │ Set saving = true    │
│ Changes │   │ API call             │
│ Close   │   │ Set saving = false   │
└─────────┘   │ Close Dialog         │
              │ Show Success Toast   │
              └──────────────────────┘
```

## Component Relationship

```
┌──────────────────────────────────────────────────────────┐
│                  Your Page/Component                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ State Management                                   │ │
│  │ - deleteOpen: boolean                             │ │
│  │ - deleting: boolean                               │ │
│  │ - itemToDelete: Item | null                       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Delete Button                                      │ │
│  │ onClick: setDeleteOpen(true)                      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ <DeleteConfirmation />                            │ │
│  │ Props:                                            │ │
│  │  - open={deleteOpen}                             │ │
│  │  - loading={deleting}                            │ │
│  │  - itemName={itemToDelete?.name}                 │ │
│  │  - onConfirm={handleDelete}                      │ │
│  │  - onCancel={() => setDeleteOpen(false)}         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## State Machine (Delete Example)

```
                    ┌─────────────────┐
                    │    IDLE         │
                    │ (hidden dialog) │
                    └────────┬────────┘
                             │
                    User clicks "Delete"
                             │
                             ▼
                    ┌─────────────────┐
                    │ SHOWING DIALOG  │
                    │ (awaiting input)│
                    └────────┬────────┘
                     ┌───────┴────────┐
                 Cancel        Confirm
                     │              │
                     ▼              ▼
              ┌─────────────┐  ┌──────────────┐
              │ HIDDEN      │  │ LOADING      │
              │ (back IDLE) │  │ (API call)   │
              └─────────────┘  └──────┬───────┘
                                      │
                        API Response Success
                                      │
                                      ▼
                              ┌─────────────┐
                              │ IDLE        │
                              │ (page done) │
                              └─────────────┘
```

## Updated Components Map

```
┌─────────────────────────────────────────────────────┐
│           RESTAURANT SAAS APP                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Settings Panel                               │  │
│  ├──────────────────────────────────────────────┤  │
│  │ ✅ Store Name (SaveConfirmation)            │  │
│  │ ✅ Tax Rate (SaveConfirmation)              │  │
│  │ ✅ Roles (Save + DeleteConfirmation)        │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Admin Section                                │  │
│  ├──────────────────────────────────────────────┤  │
│  │ ✅ Subscriptions (SaveConfirmation)          │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Tables & Data Management                    │  │
│  ├──────────────────────────────────────────────┤  │
│  │ ✅ Products Table (DeleteConfirmation)      │  │
│  │ ✅ Records Table (DeleteConfirmation)       │  │
│  │ ✅ Orders (DeleteConfirmation)              │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Import Example

```
┌─────────────────────────────────────────────────┐
│ Your Component                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│ import {                                        │
│   DeleteConfirmation,                           │
│   SaveConfirmation,                             │
│   EditConfirmation,                             │
│ } from '@/components/ui/confirmation-dialogs'  │
│                                                 │
│ export function MyComponent() {                 │
│   const [open, setOpen] = useState(false)      │
│   const [loading, setLoading] = useState(false) │
│                                                 │
│   return (                                      │
│     <>                                          │
│       <Button onClick={() => setOpen(true)}>   │
│         Delete                                  │
│       </Button>                                 │
│                                                 │
│       <DeleteConfirmation                       │
│         open={open}                            │
│         loading={loading}                      │
│         onConfirm={handleDelete}               │
│         onCancel={() => setOpen(false)}        │
│       />                                        │
│     </>                                        │
│   )                                            │
│ }                                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
User Action (Delete/Save)
        │
        ▼
Set Dialog Open State
        │
        ▼
┌─────────────────────────────┐
│ Show Confirmation Dialog    │
│ (DeleteConfirmation)        │
└─────────────────────────────┘
        │
        ├─────────────┬──────────────┐
        │             │              │
    [Cancel]     [Confirm]    [Escape key]
        │             │              │
        ▼             ▼              ▼
    Set open     Set loading    Set open
   = false       = true        = false
        │             │              │
        │             ▼              │
        │          API Call          │
        │             │              │
        │             ▼              │
        │          Success/Error     │
        │             │              │
        │             ▼              │
        │        Set loading = false │
        │        Set open = false    │
        │                            │
        └────────────┬───────────────┘
                     │
                     ▼
            Component Re-renders
         (Dialog closes, page updates)
```

---

These diagrams show how the confirmation dialogs integrate with your app flow!
