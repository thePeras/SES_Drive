import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit2, Share2 } from 'lucide-react';

export function FileManager() {
    const [files, setFiles] = useState([]);
    const [newFileName, setNewFileName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch('/api/files', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load files');
                return res.json();
            })
            .then((data) => {
                setFiles(data);
                setError('');
            })
            .catch(() => setError('Failed to load files'))
            .finally(() => setLoading(false));
    }, []);

    const createFile = () => {
        if (!newFileName.trim()) {
            setError('File name cannot be empty');
            return;
        }
        setLoading(true);
        fetch('/api/files/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ name: newFileName, type: 'file' }),
        })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to create file');
                return res.json();
            })
            .then((file) => {
                setFiles((files) => [...files, file]);
                setNewFileName('');
                setError('');
            })
            .catch(() => setError('Failed to create file'))
            .finally(() => setLoading(false));
    };

    const deleteFile = (id: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;
        setLoading(true);
        fetch(`/api/files/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to delete file');
                setFiles((files) => files.filter((file) => file._id !== id));
                setError('');
            })
            .catch(() => setError('Failed to delete file'))
            .finally(() => setLoading(false));
    };

    const renameFile = (id: string, oldName: string) => {
        const newName = prompt('Enter new name', oldName);
        if (!newName || newName.trim() === '') return;
        setLoading(true);
        fetch(`/api/files/${id}/rename`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ newName }),
        })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to rename file');
                return res.json();
            })
            .then((updatedFile) => {
                setFiles((files) =>
                    files.map((file) => (file._id === id ? updatedFile : file))
                );
                setError('');
            })
            .catch(() => setError('Failed to rename file'))
            .finally(() => setLoading(false));
    };

    const shareFile = (id: string) => {
        const userId = prompt('Enter user ID to share with:');
        if (!userId) return;
        const permission = prompt('Enter permission (read/write):');
        if (!permission || !['read', 'write'].includes(permission)) {
            alert('Permission must be "read" or "write"');
            return;
        }
        setLoading(true);
        fetch(`/api/files/${id}/share`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ userId, permission }),
        })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to share file');
                alert('File shared successfully!');
            })
            .catch(() => alert('Failed to share file'))
            .finally(() => setLoading(false));
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-900 rounded-lg shadow-lg text-white">
            <h2 className="text-2xl font-semibold mb-4">File Manager</h2>

            {error && (
                <div className="mb-4 bg-red-500 text-white px-4 py-2 rounded-md">
                    {error}
                </div>
            )}

            <div className="flex mb-6 gap-2">
                <Input
                    placeholder="New file name"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    disabled={loading}
                    className="flex-grow"
                />
                <Button onClick={createFile} disabled={loading}>
                    Create File
                </Button>
            </div>

            {loading ? (
                <p className="text-center text-gray-400">Loading files...</p>
            ) : (
                <table className="w-full table-auto border-collapse border border-gray-700">
                    <thead>
                    <tr className="bg-gray-800">
                        <th className="border border-gray-700 px-4 py-2 text-left">Name</th>
                        <th className="border border-gray-700 px-4 py-2">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {files.length === 0 ? (
                        <tr>
                            <td colSpan={2} className="text-center py-4 text-gray-500">
                                No files found.
                            </td>
                        </tr>
                    ) : (
                        files.map((file) => (
                            <tr key={file._id} className="hover:bg-gray-800">
                                <td className="border border-gray-700 px-4 py-2 flex items-center gap-2">
                                    {file.type === 'file' ? (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-blue-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 21h10a2 2 0 002-2v-7l-6-6H7a2 2 0 00-2 2v11a2 2 0 002 2z"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-yellow-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 7h4l3 3h8a1 1 0 011 1v7a1 1 0 01-1 1H3z"
                                            />
                                        </svg>
                                    )}
                                    <span>{file.name}</span>
                                </td>
                                <td className="border border-gray-700 px-4 py-2 text-center space-x-3">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => renameFile(file._id, file.name)}
                                        title="Rename"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => shareFile(file._id)}
                                        title="Share"
                                    >
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteFile(file._id)}
                                        title="Delete"
                                        className="text-red-500"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            )}
        </div>
    );
}
