import React, { useState, useEffect } from 'react';
import { Users, UserPlus, ToggleLeft, ToggleRight, Eye, EyeOff, Trash2 } from 'lucide-react';
import axios from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';
import CreateAgentModal from './CreateAgentModal';

const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await axios.get('/api/auth/agents');
      // Fix: API returns { success, count, data: agents } structure
      setAgents(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      const message = error.response?.data?.message || 'Error fetching agents';
      toast.error(message);
      console.error('Fetch agents error:', error);
      // Set empty array on error to prevent length errors
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentCreated = (newAgent) => {
    setAgents(prev => [...prev, newAgent]);
    toast.success('Agent created successfully!');
  };

  const toggleAgentStatus = async (agentId, currentStatus) => {
    try {
      const response = await axios.put(`/api/auth/agents/${agentId}/status`, {
        isActive: !currentStatus
      });

      setAgents(prev => prev.map(agent =>
        agent._id === agentId
          ? { ...agent, isActive: !currentStatus }
          : agent
      ));

      toast.success(response.data.message);
    } catch (error) {
      const message = error.response?.data?.message || 'Error updating agent status';
      toast.error(message);
      console.error('Toggle agent status error:', error);
    }
  };

  const deleteAgent = async (agentId, agentName) => {
    if (!window.confirm(`Are you sure you want to delete agent "${agentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/api/auth/agents/${agentId}`);
      
      setAgents(prev => prev.filter(agent => agent._id !== agentId));
      toast.success('Agent deleted successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Error deleting agent';
      toast.error(message);
      console.error('Delete agent error:', error);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'agent1':
        return 'bg-blue-100 text-blue-800';
      case 'agent2':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'agent1':
        return 'Lead Generation & Qualification';
      case 'agent2':
        return 'Follow-up & Conversion';
      case 'admin':
        return 'Full Access';
      default:
        return 'Unknown Role';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Users className="text-blue-600 mr-3" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Agent Management</h2>
              <p className="text-sm text-gray-600">Manage agent accounts and permissions</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus size={20} className="mr-2" />
            Create Agent
          </button>
        </div>
      </div>

      <div className="p-6">
        {agents.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
            <p className="text-gray-600 mb-4">Create your first agent account to get started</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Agent
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Agent</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Last Login</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{agent.name}</div>
                        <div className="text-sm text-gray-600">{agent.email}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(agent.role)}`}>
                          {agent.role.toUpperCase()}
                        </span>
                        <div className="text-xs text-gray-600 mt-1">
                          {getRoleDescription(agent.role)}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {agent.isActive ? (
                          <Eye className="text-green-500 mr-2" size={16} />
                        ) : (
                          <EyeOff className="text-red-500 mr-2" size={16} />
                        )}
                        <span className={`text-sm font-medium ${
                          agent.isActive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">
                        {agent.lastLogin ? formatDate(agent.lastLogin) : 'Never'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">
                        {formatDate(agent.createdAt)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleAgentStatus(agent._id, agent.isActive)}
                          className={`p-2 rounded-lg transition-colors ${
                            agent.isActive
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={agent.isActive ? 'Deactivate Agent' : 'Activate Agent'}
                        >
                          {agent.isActive ? (
                            <ToggleRight size={20} />
                          ) : (
                            <ToggleLeft size={20} />
                          )}
                        </button>
                        <button
                          onClick={() => deleteAgent(agent._id, agent.name)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Agent"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAgentCreated={handleAgentCreated}
      />
    </div>
  );
};

export default AgentManagement;
