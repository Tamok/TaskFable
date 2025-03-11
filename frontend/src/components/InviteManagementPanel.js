import React from 'react';
import InviteLinkPanel from './InviteLinkPanel';
import InviteListPanel from './InviteListPanel';
import './InviteManagementPanel.css';

const InviteManagementPanel = ({ questLogId, user }) => {
  return (
    <div className="invite-management-panel">
      <InviteLinkPanel questLogId={questLogId} user={user} />
      <hr />
      <InviteListPanel questLogId={questLogId} user={user} />
    </div>
  );
};

export default InviteManagementPanel;
