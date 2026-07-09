const fs = require('fs');
['patch_admin_ailab_rest.cjs', 'patch_chat_rest.cjs', 'patch_planner_rest.cjs', 'patch_notes_rest.cjs', 'patch_admin_settings_labels.cjs', 'revert_ailab.cjs', 'revert_chat.cjs', 'revert_notes.cjs', 'revert_planner.cjs'].forEach(f => {
  if (fs.existsSync(f)) fs.unlinkSync(f);
});
