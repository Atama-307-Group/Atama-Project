import React, { useState } from 'react';

function CreateFolder() {
    const [name, setName] = useState('');

    const handleSubmit = async () => {
        const response = await fetch('http://localhost:8080/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(name) // Sending the string name
        });

        if (response.ok) {
            const data = await response.json();
            alert(`Folder "${data.name}" created successfully!`);
            setName(''); // Clear input
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc' }}>
            <h3>Create New Folder</h3>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Folder name..."
            />
            <button onClick={handleSubmit}>Create</button>
        </div>
    );
}

export default CreateFolder;