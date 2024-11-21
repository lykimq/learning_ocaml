import React, {useState} from 'react';
import {View, TextInput, Button} from 'react-native';

// Form for uploading media
const MediaUpload = ({onSubmit}) => {
  const [title, setTitle] = useState ('');
  const [fileUrl, setFileUrl] = useState ('');

  const handleSubmit = () => {
    onSubmit ({title, fileUrl});
  };

  return (
    <View>
      <TextInput
        placeholder="Media Title"
        value={title}
        onChangeText={setTitle}
        style={{borderWidth: 1, marginBottom: 10}}
      />
      <TextInput
        placeholder="Media File URL"
        value={fileUrl}
        onChangeText={setFileUrl}
        style={{borderWidth: 1, marginBottom: 10}}
      />
      <Button title="Upload" onPress={handleSubmit} />
    </View>
  );
};

export default MediaUpload;
