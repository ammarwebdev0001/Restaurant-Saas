# Quick Reference - Confirmation Dialogs

## Import

```tsx
import { 
  DeleteConfirmation, 
  SaveConfirmation, 
  EditConfirmation 
} from '@/components/ui/confirmation-dialogs';
```

## DeleteConfirmation

**Use for**: Removing items from database

```tsx
<DeleteConfirmation
  open={deleteOpen}
  itemName="Product Name"
  loading={deleting}
  onConfirm={handleDelete}
  onCancel={() => setDeleteOpen(false)}
/>
```

## SaveConfirmation

**Use for**: Updating/saving data

```tsx
<SaveConfirmation
  open={saveOpen}
  itemName="Store Name"
  loading={saving}
  onConfirm={handleSave}
  onCancel={() => setSaveOpen(false)}
/>
```

## EditConfirmation

**Use for**: Confirming edit operations

```tsx
<EditConfirmation
  open={editOpen}
  itemName="Item Being Edited"
  loading={editing}
  onConfirm={handleEdit}
  onCancel={() => setEditOpen(false)}
/>
```

## Already Updated Components

✅ `components/setting/components/shopname.tsx`
✅ `components/setting/components/taxrate.tsx`
✅ `components/setting/components/roles.tsx`
✅ `components/admin/subscription-edit-dialog.tsx`
✅ `components/tableproduct/components/btn/alertDelete.tsx`
✅ `components/tablerecords/components/btn/alertDelete.tsx`
✅ `components/order/components/alert.tsx`

## Common Props

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `open` | boolean | ✓ | Show/hide dialog |
| `onConfirm` | function | ✓ | Called when user confirms |
| `onCancel` | function | ✓ | Called when user cancels |
| `loading` | boolean | | Shows disabled state |
| `itemName` | string | | Displayed in title |
| `title` | string | | Dialog title (has defaults) |
| `description` | string | | Dialog description |
| `confirmText` | string | | Confirm button text |
| `cancelText` | string | | Cancel button text |

## Pattern: Basic Delete

```tsx
const [open, setOpen] = useState(false);
const [loading, setLoading] = useState(false);

const handleDelete = async () => {
  setLoading(true);
  try {
    await api.delete(id);
    setOpen(false);
  } finally {
    setLoading(false);
  }
};

return (
  <>
    <button onClick={() => setOpen(true)}>Delete</button>
    <DeleteConfirmation
      open={open}
      loading={loading}
      onConfirm={handleDelete}
      onCancel={() => setOpen(false)}
    />
  </>
);
```

## Pattern: Basic Save

```tsx
const [open, setOpen] = useState(false);
const [loading, setLoading] = useState(false);

const handleSave = async () => {
  setLoading(true);
  try {
    await api.update(data);
    setOpen(false);
  } finally {
    setLoading(false);
  }
};

return (
  <>
    <button onClick={() => setOpen(true)}>Save</button>
    <SaveConfirmation
      open={open}
      loading={loading}
      onConfirm={handleSave}
      onCancel={() => setOpen(false)}
    />
  </>
);
```

## Error Handling

```tsx
const handleDelete = async () => {
  setLoading(true);
  try {
    await api.delete(id);
    toast.success('Deleted!');
    setOpen(false);
  } catch (error) {
    toast.error('Failed to delete');
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

## Keyboard Support

- **Tab** - Navigate buttons
- **Enter** - Confirm action
- **Escape** - Cancel/close

All supported automatically! ✨
