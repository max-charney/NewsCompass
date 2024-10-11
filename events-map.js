const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <button className="modal-close" onClick={onClose}>&times;</button>
          {children}
        </div>
      </div>
    );
  };
  
  const EventCard = ({ event, onSelect }) => (
    <div className="event-card" onClick={() => onSelect(event)}>
      <h4>{event.title}</h4>
      <p className="event-type">{event.eventType === 'virtual' ? '🌐 Virtual' : '📍 In-Person'}</p>
      <p className="event-date">{new Date(event.date).toLocaleDateString()} at {event.time} {event.timeZone}</p>
      <p className="event-creator">By: {event.creatorName}</p>
      <p className="event-description">{event.description.substring(0, 100)}...</p>
    </div>
  );
  
  const EventsMap = () => {
    const [map, setMap] = React.useState(null);
    const [events, setEvents] = React.useState([]);
    const [selectedEvent, setSelectedEvent] = React.useState(null);
    const [newEvent, setNewEvent] = React.useState({
        title: '',
        description: '',
        creatorName: '',
        creatorPosition: '',
        date: '',
        time: '',
        timeZone: 'UTC',
        eventType: 'in-person',
        virtualLink: '',
        details: '',
        lat: null,
        lng: null
    });
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = React.useState(false);
    const [joinInfo, setJoinInfo] = React.useState({
        name: '',
        email: '',
        position: ''
    });

    // Search states
    const [filters, setFilters] = React.useState({
        searchTerm: '',
        eventType: 'all',
        timeRange: 'all',
        startDate: '',
        endDate: ''
    });
    const [searchResults, setSearchResults] = React.useState([]);
    const [hasSearched, setHasSearched] = React.useState(false);

    React.useEffect(() => {
        const mapInstance = L.map('map').setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
        setMap(mapInstance);

        mapInstance.on('click', (e) => {
            setNewEvent(prev => ({ ...prev, lat: e.latlng.lat, lng: e.latlng.lng }));
            setIsCreateModalOpen(true);
        });

        return () => {
            mapInstance?.remove();
        };
    }, []);

    React.useEffect(() => {
        if (map && events.length > 0) {
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });

            const eventsToShow = hasSearched ? searchResults : events;
            eventsToShow.forEach((event) => {
                L.marker([event.lat, event.lng])
                    .addTo(map)
                    .on('click', () => {
                        const updatedEvent = events.find(e => e.id === event.id);
                        setSelectedEvent(updatedEvent);
                        setIsJoinModalOpen(true);
                    });
            });
        }
    }, [map, events, searchResults, hasSearched]);

    const handleSearch = (e) => {
        e.preventDefault();
        const filteredEvents = events.filter(event => {
            const matchesSearch = event.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                                event.description.toLowerCase().includes(filters.searchTerm.toLowerCase());
            
            const matchesType = filters.eventType === 'all' || event.eventType === filters.eventType;
            
            const eventDate = new Date(event.date);
            let matchesTimeRange = true;
            
            if (filters.timeRange === 'upcoming') {
                matchesTimeRange = eventDate >= new Date();
            } else if (filters.timeRange === 'custom' && filters.startDate && filters.endDate) {
                const start = new Date(filters.startDate);
                const end = new Date(filters.endDate);
                matchesTimeRange = eventDate >= start && eventDate <= end;
            }

            return matchesSearch && matchesType && matchesTimeRange;
        });

        setSearchResults(filteredEvents);
        setHasSearched(true);
    };

    const handleCreateEvent = (e) => {
        e.preventDefault();
        if (newEvent.lat && newEvent.lng) {
            const eventId = Date.now();
            const newEventWithId = { ...newEvent, id: eventId, attendees: [] };
            setEvents(prev => [...prev, newEventWithId]);
            setNewEvent({
                title: '',
                description: '',
                creatorName: '',
                creatorPosition: '',
                date: '',
                time: '',
                timeZone: 'UTC',
                eventType: 'in-person',
                virtualLink: '',
                details: '',
                lat: null,
                lng: null
            });
            setIsCreateModalOpen(false);
        }
    };

    const handleJoinEvent = (e) => {
        e.preventDefault();
        if (selectedEvent && joinInfo.name && joinInfo.email) {
            const updatedEvents = events.map(event =>
                event.id === selectedEvent.id
                    ? {
                        ...event,
                        attendees: [...(event.attendees || []), joinInfo]
                      }
                    : event
            );
            setEvents(updatedEvents);
            
            // Update the selectedEvent with the new attendee
            const updatedSelectedEvent = updatedEvents.find(event => event.id === selectedEvent.id);
            setSelectedEvent(updatedSelectedEvent);
            
            setJoinInfo({ name: '', email: '', position: '' });
            setIsJoinModalOpen(false);
        }
    };

    return (
        <div className="events-map-container">
            <div id="map" style={{ height: '600px', width: '100%' }}></div>

            <div className="events-search">
                <h3>Find Events</h3>
                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-grid">
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={filters.searchTerm}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                            className="search-input"
                        />
                        
                        <select
                            value={filters.eventType}
                            onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                            className="filter-select"
                        >
                            <option value="all">All Event Types</option>
                            <option value="in-person">In-Person</option>
                            <option value="virtual">Virtual</option>
                        </select>

                        <select
                            value={filters.timeRange}
                            onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                            className="filter-select"
                        >
                            <option value="all">All Dates</option>
                            <option value="upcoming">Upcoming Events</option>
                            <option value="custom">Custom Range</option>
                        </select>

                        {filters.timeRange === 'custom' && (
                            <>
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="date-input"
                                />
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="date-input"
                                />
                            </>
                        )}
                        <button type="submit" className="search-button">Search Events</button>
                    </div>
                </form>

                {hasSearched && (
                    <div className="search-results">
                        <h4>Found {searchResults.length} events</h4>
                        <div className="event-cards-grid">
                            {searchResults.map(event => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    onSelect={(event) => {
                                        const updatedEvent = events.find(e => e.id === event.id);
                                        setSelectedEvent(updatedEvent);
                                        setIsJoinModalOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
                <h3>Create New Event</h3>
                <form onSubmit={handleCreateEvent} className="create-event-form">
                    <input
                        type="text"
                        placeholder="Event Title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Your Name (Event Creator)"
                        value={newEvent.creatorName}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, creatorName: e.target.value }))}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Your Position (e.g., Professor at XYZ)"
                        value={newEvent.creatorPosition}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, creatorPosition: e.target.value }))}
                        required
                    />
                    <div className="form-group">
                        <select
                            value={newEvent.eventType}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, eventType: e.target.value }))}
                            required
                            className="event-type-select"
                        >
                            <option value="in-person">In-Person Event</option>
                            <option value="virtual">Virtual Event</option>
                        </select>
                    </div>
                    {newEvent.eventType === 'virtual' && (
                        <input
                            type="url"
                            placeholder="Virtual Meeting Link"
                            value={newEvent.virtualLink}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, virtualLink: e.target.value }))}
                            required
                        />
                    )}
                    <textarea
                        placeholder="Event Description"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                        required
                    ></textarea>
                    <input
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                        required
                    />
                    <div className="time-input-group">
                        <input
                            type="time"
                            value={newEvent.time}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                            required
                        />
                        <select
                            value={newEvent.timeZone}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, timeZone: e.target.value }))}
                            required
                        >
                            <option value="UTC">UTC</option>
                            <option value="EST">EST</option>
                            <option value="CST">CST</option>
                            <option value="PST">PST</option>
                            <option value="GMT">GMT</option>
                        </select>
                    </div>
                    <textarea
                        placeholder="Additional Details"
                        value={newEvent.details}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, details: e.target.value }))}
                    ></textarea>
                    <button type="submit">Create Event</button>
                </form>
            </Modal>

            <Modal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)}>
                {selectedEvent && (
                    <div>
                        <h3>{selectedEvent.title}</h3>
                        <p><strong>Created by:</strong> {selectedEvent.creatorName} ({selectedEvent.creatorPosition})</p>
                        <p><strong>Event Type:</strong> {selectedEvent.eventType}</p>
                        {selectedEvent.eventType === 'virtual' && (
                            <p><strong>Virtual Link:</strong> <a href={selectedEvent.virtualLink} target="_blank" rel="noopener noreferrer">Join Meeting</a></p>
                        )}
                        <p><strong>Date:</strong> {selectedEvent.date}</p>
                        <p><strong>Time:</strong> {selectedEvent.time} {selectedEvent.timeZone}</p>
                        <p><strong>Description:</strong> {selectedEvent.description}</p>
                        <p><strong>Additional Details:</strong> {selectedEvent.details}</p>
                        <p><strong>Attendees:</strong> {(selectedEvent.attendees || []).length}</p>
                        <ul>
                            {(selectedEvent.attendees || []).map((attendee, index) => (
                                <li key={index}>{attendee.name} - {attendee.position}</li>
                            ))}
                        </ul>
                        <form onSubmit={handleJoinEvent}>
                            <input
                                type="text"
                                placeholder="Your Name"
                                value={joinInfo.name}
                                onChange={(e) => setJoinInfo(prev => ({ ...prev, name: e.target.value }))}
                                required
                            />
                            <input
                                type="email"
                                placeholder="Your Email"
                                value={joinInfo.email}
                                onChange={(e) => setJoinInfo(prev => ({ ...prev, email: e.target.value }))}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Your Position"
                                value={joinInfo.position}
                                onChange={(e) => setJoinInfo(prev => ({ ...prev, position: e.target.value }))}
                            />
                            <button type="submit">Join Event</button>
                        </form>
                    </div>
                )}
            </Modal>
        </div>
    );
};

ReactDOM.render(React.createElement(EventsMap), document.getElementById('events-map-root'));
