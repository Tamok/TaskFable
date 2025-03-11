import React, { useState } from 'react';
import Board from './Board';
import ActivityLogPanel from './ActivityLogPanel';
import InviteManagementPanel from './InviteManagementPanel';
import AdventurersPanel from './AdventurersPanel';
import './BoardSubtabs.css';

const BoardSubtabs = ({ tasks, refreshTasks, user, currentQuestLog }) => {
  const [activeTab, setActiveTab] = useState('tasks');

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks':
        return <Board tasks={tasks} refreshTasks={refreshTasks} user={user} />;
      case 'activity':
        return <ActivityLogPanel questLogId={currentQuestLog.id} user={user} />;
      case 'invite':
        return <InviteManagementPanel questLogId={currentQuestLog.id} user={user} />;
      case 'adventurers':
        return <AdventurersPanel questLogId={currentQuestLog.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="board-subtabs">
      <div className="subtabs-header">
        <button className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')}>Tasks</button>
        <button className={activeTab === 'activity' ? 'active' : ''} onClick={() => setActiveTab('activity')}>Activity</button>
        <button className={activeTab === 'invite' ? 'active' : ''} onClick={() => setActiveTab('invite')}>Invite</button>
        <button className={activeTab === 'adventurers' ? 'active' : ''} onClick={() => setActiveTab('adventurers')}>Adventurers</button>
      </div>
      <div className="subtabs-content">{renderContent()}</div>
    </div>
  );
};

export default BoardSubtabs;
