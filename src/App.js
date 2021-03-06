import React, { useState, useEffect } from 'react';
import Welcome from './Welcome'
import Track from './Track'
import Spinner from './Spinner'
import axios from 'axios'
import { toQuery, toParams } from './Routing'

function App() {
    var date = new Date();
    const [tracks, setTracks] = useState([])
    const [input, setInput] = useState("nytimes")
    const [code, setCode] = useState("")
    const [user, setUser] = useState("Spotify user")
    const [userId, setUserId] = useState('')
    const [token, setToken] = useState('')
    const [playlistTitle, setPlaylistTitle] = useState(date.toLocaleDateString()+" vibes")
    const [playlistStatus, setPlaylistStatus] = useState('none')
    const [status, setStatus] = useState("notAuthorized")
    const [sentimentColor, setSentimentColor] = useState([{background: "beige", text: "black", description: ""}])

    const handleInputChange = (event) => {
        const target = event.target;
        setInput(target.value);
    }

    const handlePlaylistChange = (event) => {
        const target = event.target;
        setPlaylistTitle(target.value);
    }
    
    useEffect(() => {
        const params = toParams(window.location.search.replace(/^\?/, ''))
        if (params.code) {
            setStatus("authorized")
            setCode(params.code)
        }
    }, [])

    const search = toQuery({
        client_id: '2d860b1bb2be4ca296384d7cef9b0301',
        response_type: 'code',
        scope: "user-top-read,playlist-modify-public",
        redirect_uri: 'https://zach332.github.io/TweetSoundtrack/',
    });
    
    const onCLick = () => {
        window.location.href = 'https://accounts.spotify.com/authorize?'+search
    }

    const handleSubmit = (event) => {
        setStatus("loading")
        axios.get('https://zach33.pythonanywhere.com/songs', {
            params: {
                twitterAccount: input,
                code: code
            }
        }).then(response => {
            setSentimentColor(response.data.sentimentColor)
            setUser(response.data.spotify.user)
            setUserId(response.data.spotify.userId)
            setToken(response.data.spotify.token)
            setTracks(response.data.spotify.recommendations.tracks)
        }).then(() => {
            setStatus("success")
        }).catch(() => {
            setStatus("error")
        })
        event.preventDefault()
    }

    const handlePlaylistSubmit = (event) => {
        axios.post('https://api.spotify.com/v1/users/'+userId+'/playlists', {
            name: playlistTitle
        },
        {
            headers: {
                'Authorization': 'Bearer '+token,
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            axios.post('https://api.spotify.com/v1/playlists/'+response.data.id+'/tracks', {
                uris: tracks.map(track => track.uri)
            },
            {
                headers: {
                    'Authorization': 'Bearer '+token,
                    'Content-Type': 'application/json'
                }
            }).then(
                setPlaylistStatus('success')
            ).catch((err) =>{
                console.log(err)
                setPlaylistStatus('failure')
            })
        }).catch((err) =>{
            console.log(err)
            setPlaylistStatus('failure')
        })
        event.preventDefault()
    }

    if(status == "loading") {
        return <Spinner />
    }

    if(status == 'error') {
        return (
            <div>
                <p>The server has encountered an error. Your Spotify login may have expired. We recommend that you <a href="/TweetSoundtrack">start over.</a></p>
            </div>
        )
    }

    if(status == "notAuthorized") {
        return (
            <div>
                <Welcome />
                <div className="col-md-12 text-center" style={{paddingBottom: "0%"}}>
                    <button type="btn btn-primary" onClick={onCLick} className="btn btn-outline-primary btn-lg">
                        Login to Spotify
                        <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-box-arrow-in-right" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0v-2z"></path>
                            <path fillRule="evenodd" d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        )
    }

    if(status == "authorized") {
        return (
            <div>
                <div className="response" style={{paddingLeft:"10%", 
                    paddingRight:"10%", 
                    textAlign:"center", 
                    fontSize:"30px", 
                    paddingBottom: "5%"
                    }}>
                    Thanks, we've grabbed your listening information. Now let us know a Twitter user you want to 🎶vibe🎶 with.
                </div>
                <div className="mx-auto" style={{paddingBottom: "0%"}}>
                    <form className="py-4" onSubmit={handleSubmit} style={{width: "100%", 
                    padding:"30%"}}>
                        <div className="form-group row">
                            <label htmlFor="content">Twitter account</label>
                            <input className="form-control" id="content" type="text" placeholder="nytimes" onChange={handleInputChange}></input>
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg mt-4">Generate playlist</button>
                    </form>
                </div>
            </div>
        )
    }

    let form
    if(playlistStatus === 'failure') {
        form = <p>Sorry; an error was encountered</p>
    } else if (playlistStatus === 'success') {
        form = <p>The playlist was saved to your Spotify account!</p>
    } else {
        form = (
            <form class="form-inline" onSubmit={handlePlaylistSubmit}>
                <label for="title" class="col-sm-2 col-form-label">Playlist title</label>
                <div class="form-group mx-sm-3 mb-2">
                    <input type="text" class="form-control" id="title" onChange={handlePlaylistChange} placeholder={date.toLocaleDateString()+" vibes"}/>
                </div>
                <button type="submit" class="btn btn-primary mb-2">Add playlist to Spotify</button>
            </form>
        )
    }

    return (
        <div className="App">
            <div className="welcome" style={{fontSize:"50px", fontWeight:"bold"}}>
                Welcome, {user}.&nbsp;&nbsp;
                <button type="btn btn-primary" onClick={(e) => {
                    e.preventDefault();
                    window.location.href='http://spotify.com/logout';
                    }} className="btn btn-outline-primary btn-lg">
                    Not you?
                    <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-box" fill="currentColor">
                        <path fillRule="evenodd" d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0v-2z"></path>
                        <path fillRule="evenodd" d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"></path>
                    </svg>
                </button>
            </div>
            <div className="welcome" style={{fontSize:"25px"}}>We've curated the below playlist for you based on the Twitter username you provided and your listening habits.</div>
            <br></br>
            <div className="container">
                <hr/>
                <div className="row py-4">
                    <h2 className="col col-auto">Sentiment color:</h2>
                    <div class="col col-auto rounded-0 card" style={{background:sentimentColor.background}}></div>
                    <p className="col">{sentimentColor.description}</p>
                </div>
                <hr/>
                {form}
                <div className="row" style={{paddingBottom: "50%"}}>
                    {tracks.map(track => <Track key={track.id} track={track} sentimentColor={sentimentColor} />)}
                </div>
            </div>
        </div>
    );
}

export default App;