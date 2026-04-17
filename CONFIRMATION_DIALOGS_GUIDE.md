# Confirmation Dialogs Guide

This document explains how to use the reusable confirmation dialog components across the project.

## Overview

The project now includes three reusable confirmation dialog components located in `components/ui/confirmation-dialogs/`:

1. **DeleteConfirmation** - For delete operations
2. **SaveConfirmation** - For save/update operations
3. **EditConfirmation** - For edit operations

## Components Already Updated

The following components have been updated to use the new confirmation dialogs:

### Settings Components
- `components/setting/components/shopname.tsx` - Uses SaveConfirmation
- `components/setting/components/taxrate.tsx` - Uses SaveConfirmation
- `components/setting/components/roles.tsx` - Uses both SaveConfirmation and DeleteConfirmation

### Admin Components
- `components/admin/subscription-edit-dialog.tsx` - Uses SaveConfirmation

### Table Components
- `components/tableproduct/components/btn/alertDelete.tsx` - Uses DeleteConfirmation
- `components/tablerecords/components/btn/alertDelete.tsx` - Uses DeleteConfirmation
- `components/order/components/alert.tsx` - Uses DeleteConfirmation

## How to Use

### 1. DeleteConfirmation

Use this component to confirm before deleting items.

```tsx
import { DeleteConfirmation } from '@/components/ui/confirmation-dialogs';
import { useState } from 'react';

function MyComponent() {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      // Your delete logic here
      await deleteAPI();
      setDeleteOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setDeleteOpen(true)}>Delete</button>
      
      <DeleteConfirmation
        open={deleteOpen}
        title="Delete Item" // Optional (default: "Delete Item")
        description="Are you sure?" // Optional (default: standard message)
        itemName="Product Name" // Optional - will be displayed in title
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        confirmText="Delete" // Optional (default: "Delete")
        cancelText="Cancel" // Optional (default: "Cancel")
      />
    </>
  );
}
```

### 2. SaveConfirmation

Use this component to confirm before saving changes.

```tsx
import { SaveConfirmation } from '@/components/ui/confirmation-dialogs';
import { useState } from 'react';

function MyComponent() {
  const [saveOpen, setSaveOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Your save logic here
      await saveAPI();
      setSaveOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setSaveOpen(true)}>Save</button>
      
      <SaveConfirmation
        open={saveOpen}
        title="Save Changes" // Optional (default: "Save Changes")
        description="Are you sure?" // Optional
        itemName="Store Name" // Optional
        loading={loading}
        onConfirm={handleSave}
        onCancel={() => setSaveOpen(false)}
        confirmText="Save" // Optional (default: "Save")
        cancelText="Cancel" // Optional (default: "Cancel")
      />
    </>
  );
}
```

### 3. EditConfirmation

Use this component to confirm before editing items.

```tsx
import { EditConfirmation } from '@/components/ui/confirmation-dialogs';
import { useState } from 'react';

function MyComponent() {
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEdit = async () => {
    setLoading(true);
    try {
      // Your edit logic here
      await editAPI();
      setEditOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setEditOpen(true)}>Edit</button>
      
      <EditConfirmation
        open={editOpen}
        title="Edit Item" // Optional (default: "Edit Item")
        description="Confirm changes?" // Optional
        itemName="Product" // Optional
        loading={loading}
        onConfirm={handleEdit}
        onCancel={() => setEditOpen(false)}
        confirmText="Edit" // Optional (default: "Edit")
        cancelText="Cancel" // Optional (default: "Cancel")
      />
    </>
  );
}
```

## Common Patterns

### Pattern 1: Separate Save Button Click from Confirmation

Instead of calling the save function directly, show the confirmation dialog first:

```tsx
// ❌ OLD WAY (direct API call on button click)
<Button onClick={handleSave}>Save</Button>

// ✅ NEW WAY (show confirmation first)
const [saveOpen, setSaveOpen] = useState(false);

<Button onClick={() => setSaveOpen(true)}>Save</Button>

<SaveConfirmation
  open={saveOpen}
  onConfirm={handleSave}
  onCancel={() => setSaveOpen(false)}
  loading={loading}
/>
```

### Pattern 2: Delete with Item Name

Show the item being deleted in the confirmation:

```tsx
<DeleteConfirmation
  open={deleteOpen}
  itemName={product.name}
  title="Delete Product"
  onConfirm={() => deleteProduct(product.id)}
  onCancel={() => setDeleteOpen(false)}
  loading={deleting}
/>
```

### Pattern 3: Multiple State Management

For dialogs with separate confirmation:

```tsx
const [showConfirmation, setShowConfirmation] = useState(false);
const [saving, setSaving] = useState(false);

const handleSaveClick = () => {
  setShowConfirmation(true); // Show dialog
};

const handleConfirmSave = async () => {
  setSaving(true);
  try {
    await saveAPI();
    setShowConfirmation(false);
  } finally {
    setSaving(false);
  }
};
```

## Replacing Old Alert Dialogs

When you find old `AlertDialog` code like:

```tsx
if (!confirm('Are you sure?')) return;
await deleteItem();
```

Replace it with:

```tsx
const [confirmOpen, setConfirmOpen] = useState(false);
const [deleting, setDeleting] = useState(false);

const handleDelete = async () => {
  setDeleting(true);
  try {
    await deleteItem();
  } finally {
    setDeleting(false);
  }
};

// In JSX:
<DeleteConfirmation
  open={confirmOpen}
  loading={deleting}
  onConfirm={handleDelete}
  onCancel={() => setConfirmOpen(false)}
/>
```

## Files to Update Next

Look for these patterns to find components that need updating:

1. Search for: `if (!confirm(` - Used browser's native confirm dialog
2. Search for: `AlertDialog` followed by simple confirm logic
3. Search for buttons with direct delete/save handlers

Priority files to update:
- `components/dashboard/menu-manager/recommendations-tab.tsx` - Has native `confirm()` calls
- `components/dashboard/menu-manager/products-tab.tsx` - May have confirm dialogs
- `components/dashboard/menu-manager/categories-tab.tsx` - May have delete buttons
- `app/admin/settings/page.tsx` - Admin settings pages
- `components/pos/pos-screen.tsx` - POS save operations

## Component Props Reference

### DeleteConfirmation Props

```tsx
interface DeleteConfirmationProps {
  open: boolean;                          // Dialog visibility
  title?: string;                         // Dialog title (default: "Delete Item")
  description?: string;                   // Dialog description
  itemName?: string;                      // Name of item being deleted
  loading?: boolean;                      // Show loading state
  onConfirm: () => void | Promise<void>;  // Callback when confirming
  onCancel: () => void;                   // Callback when canceling
  confirmText?: string;                   // Button text (default: "Delete")
  cancelText?: string;                    // Button text (default: "Cancel")
}
```

### SaveConfirmation Props

```tsx
interface SaveConfirmationProps {
  open: boolean;
  title?: string;                         // (default: "Save Changes")
  description?: string;
  itemName?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmText?: string;                   // (default: "Save")
  cancelText?: string;                    // (default: "Cancel")
}
```

### EditConfirmation Props

```tsx
interface EditConfirmationProps {
  open: boolean;
  title?: string;                         // (default: "Edit Item")
  description?: string;
  itemName?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmText?: string;                   // (default: "Edit")
  cancelText?: string;                    // (default: "Cancel")
}
```

## Styling

All confirmation dialogs use the existing Radix UI AlertDialog styling, which includes:
- Dark mode support (automatically adapts to theme)
- Responsive design
- Smooth animations
- Accessible keyboard navigation
- Proper focus management

The dialogs respect your app's color scheme and will automatically update based on light/dark mode.

## Benefits

✅ **Consistency** - All confirmations use the same component
✅ **Accessibility** - Proper keyboard support and ARIA labels
✅ **UX** - Smooth animations and intuitive interactions
✅ **Maintainability** - Centralized component makes updates easy
✅ **Performance** - Reusable, optimized component
✅ **Loading States** - Built-in loading/disabled states
✅ **Customizable** - Props allow fine-tuning for each use case
