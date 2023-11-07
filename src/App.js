import React, { useState, useEffect, useRef } from 'react';
import { Layout, Input, Button, Spin, Image, List } from 'antd';
import axios from 'axios';
import './App.css';

const { Header, Content } = Layout;

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestedSearches, setSuggestedSearches] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const flickrApiKey = 'c11c0e428831a5c92fcbde2887ba4eb9';

  const observerRef = useRef(null);

  const handleSearch = async () => {
    setPage(1);
    setHasMore(true);
    setLoading(true);
    try {
      const response = await axios.get(
        `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=${flickrApiKey}&text=${searchQuery}&safe_search=1&format=json&nojsoncallback=1&page=1`
      );
      setPhotos(response.data.photos.photo);
      
      setSearchHistory((prevHistory) => [searchQuery, ...prevHistory]);
    } catch (error) {
      console.error('Error searching for photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (photo) => {
    setSelectedPhoto(photo);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
  };

  const performSearchFromHistory = (query) => {
    
    setSearchQuery(query);
    handleSearch();
  };

  const handleInputChange = (value) => {
    setSearchQuery(value);
    setShowSuggestions(true);
    
    setSuggestedSearches(
      searchHistory.filter((history) => history.toLowerCase().includes(value.toLowerCase()))
    );
  };

  useEffect(() => {
    handleSearch();
  }, []);

  useEffect(() => {
    
    if (observerRef.current && hasMore && !loading) {
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      };

      const observer = new IntersectionObserver(handleIntersection, options);
      observer.observe(observerRef.current);

      return () => {
        
        if (observer && observerRef.current) {
          observer.unobserve(observerRef.current);
        }
      };
    }
  }, [observerRef, hasMore, loading]);

  const handleIntersection = (entries) => {
    if (entries[0].isIntersecting && hasMore && !loading) {
      loadMorePhotos();
    }
  };

  const loadMorePhotos = async () => {
    setPage(page + 1);
    setLoading(true);
    try {
      const response = await axios.get(
        `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=${flickrApiKey}&text=${searchQuery}&safe_search=1&format=json&nojsoncallback=1&page=${page + 1}`
      );
      const newPhotos = response.data.photos.photo;
      if (newPhotos.length > 0) {
        setPhotos([...photos, ...newPhotos]);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more photos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="app-layout">
      <Header>
        <Input
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Search for photos"
        />
        <Button type="primary" onClick={handleSearch}>
          Search
        </Button>
      </Header>
      <Content className="app-content">
        {showSuggestions && suggestedSearches.length > 0 && (
          <div className="search-suggestions">
            <List
              bordered
              dataSource={suggestedSearches}
              renderItem={(item) => (
                <List.Item onClick={() => handleInputChange(item)}>{item}</List.Item>
              )}
            />
          </div>
        )}
        {loading ? (
          <Spin size="large" className="loader" />
        ) : (
          <div className="photo-grid">
            {photos.map((photo) => (
              <div key={photo.id} className="photo-item" onClick={() => openModal(photo)}>
                <Image
                  src={`https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}.jpg`}
                  alt={photo.title}
                />
              </div>
            ))}
          </div>
        )}
        {selectedPhoto && (
          <div className="modal">
            <Image
              src={`https://live.staticflickr.com/${selectedPhoto.server}/${selectedPhoto.id}_${selectedPhoto.secret}.jpg`}
              alt={selectedPhoto.title}
              preview={false}
            />
            <Button onClick={closeModal}>Close</Button>
          </div>
        )}
        {hasMore && !loading && (
          <div ref={observerRef} className="infinite-scroll-trigger">
            Loading more photos...
          </div>
        )}
      </Content>
    </Layout>
  );
}

export default App;
