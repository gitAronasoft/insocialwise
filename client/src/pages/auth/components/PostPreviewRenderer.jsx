import React from 'react';
import Carousel from "react-multi-carousel";
import { Link, useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const PostPreviewRenderer = ({ platform, post }) => {
  const navigate = useNavigate();

  const carouselResponsive = {
    desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
    tablet: { breakpoint: { max: 1024, min: 464 }, items: 1 },
    mobile: { breakpoint: { max: 464, min: 0 }, items: 1 }
  };

  const platformSVGs = { 
    instagram: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram h-6 w-6 text-white">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
    facebook: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook h-6 w-6 text-white">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
    twitter: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter h-6 w-6 text-white">
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
      </svg>
    ),
    linkedin: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin h-6 w-6 text-white">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
    youtube: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube h-6 w-6 text-white">
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <path d="m10 15 5-3-5-3z" />
      </svg>
    ),
  };

  const getPlatformColor = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'facebook':
        return 'linear-gradient(135deg, #2563EB, #1E40AF)'; // Facebook Blue gradient
      case 'linkedin':
        return 'linear-gradient(135deg, #2563EB, #1E40AF)'; // LinkedIn gradient
      case 'instagram':
        return 'linear-gradient(135deg, #C13584, #E1306C)'; // Instagram gradient
      case 'twitter':
      case 'x':
        return 'linear-gradient(135deg, #60A5FA, #2563EB)'; // Twitter gradient
      case 'youtube':
        return 'linear-gradient(135deg, #EF4444, #B91C1C)'; // YouTube gradient
      case 'tiktok':
        return 'linear-gradient(135deg, #000000, #FF0050)'; // TikTok gradient (black → red/pink)
      default:
        return 'linear-gradient(135deg, #6B7280, #374151)'; // Neutral gray gradient
    }
  };

  const handleEdit = (formId) => {
    navigate("/edit-post", { state: { formId } });
  };

  const renderMediaPreview = (platform = "", mediaToUse = null) => {
    // If mediaToUse is a JSON string, parse it
    let filteredMedia = [];
    try {
      if (typeof mediaToUse === "string") {
        filteredMedia = JSON.parse(mediaToUse);
      } else if (Array.isArray(mediaToUse)) {
        filteredMedia = mediaToUse;
      }
    } catch (err) {
      console.error("Failed to parse media JSON:", err);
      return null;
    }
  
    // Map and add URL + unique ID
    filteredMedia = filteredMedia.map((item, index) => ({
      id: index,
      type: item.type,
      url: `${BACKEND_URL}${item.path}`,
      thumbnail: item.type === "video" ? `${BACKEND_URL}${item.path}-thumbnail.jpg` : null
    }));

    if (filteredMedia.length === 0) return null;
  
    // === Instagram Carousel ===
    if (platform === "instagram") {
      return (
        <Carousel responsive={carouselResponsive} showDots infinite={true} arrows={false}>
          {filteredMedia.map((m) => (
            <div key={m.id} className="position-relative" style={{ aspectRatio: "1 / 1" }}>
              {m.type === "image" ? (
                <img src={m.url} alt="insta-img" className="w-100" style={{ height: "300px", objectFit: "cover" }}
                  onError={(e) => {e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
              ) : (
                <video src={m.url} className="w-100" style={{ height: "300px", objectFit: "cover", objectPosition: "center" }}
                  autoPlay loop muted playsInline />
              )}
            </div>
          ))}
        </Carousel>
      );
    }
  
    // ---------- Facebook && LinkedIn----------
    if (platform === "facebook" || platform === "linkedin") {
      const boxSize = "200px"; // static square size

      // 1 media
      if (filteredMedia.length === 1) {
        const m = filteredMedia[0];
        return m.type === "video" ? (
          <div className="position-relative w-100 h-100">
            <img src={m.thumbnail} alt="Video thumbnail" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }} 
              onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
            <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
          </div>
        ) : (
          <img src={m.url} className="w-100 h-100" alt="facebook-img" style={{ objectFit: "cover", objectPosition: "center" }} 
            onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
        );
      }
  
      // 2 media → up and down
      if (filteredMedia.length === 2) {
        return (
          <div className="d-flex flex-column gap-1">
            {filteredMedia.map((m) => (
              <div key={m.id} className="flex-fill position-relative" style={{ height: boxSize, width:"100%" }} >
                {m.type === "video" ? (
                  <div className="position-relative w-100 h-100">
                    <img src={m.thumbnail} alt="Video thumbnail" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                      onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                    <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                  </div>
                ) : (
                  <img src={m.url} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }} 
                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                )}
              </div>
            ))}
          </div>
        );
      }
  
      // 3 media → 2 in a column & 2 in row of second column
      if (filteredMedia.length === 3) {
        return (
          <div className="d-flex flex-column gap-1" style={{ height: boxSize * 2 }}>
            {/* First row - single image */}
            <div className="position-relative" style={{ height: boxSize, width: "100%" }}>
              {filteredMedia[0].type === "video" ? (
                <div className="position-relative w-100 h-100">
                  <img src={filteredMedia[0].thumbnail} alt="Video thumbnail" className="w-100 h-100" 
                    style={{ objectFit: "cover", objectPosition: "center" }} 
                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                  <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                </div>
              ) : (
                <img src={filteredMedia[0].url} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }} 
                  onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
              )}
            </div>
            
            {/* Second row - two images side by side */}
            <div className="row g-1" style={{ height: "auto" }}>
              {filteredMedia.slice(1, 3).map((m) => (
                <div key={m.id} className="col-6 position-relative">
                  {m.type === "video" ? (
                    <div className="position-relative w-100 h-100">
                      <img src={m.thumbnail} alt="Video thumbnail" className="w-100 h-100" 
                        style={{ objectFit: "cover", objectPosition: "center" }} 
                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                      <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                    </div>
                  ) : (
                    <img src={m.url} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }} 
                      onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} 
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
  
      // 4 media → 2 in a column & 3 in row of second column
      if (filteredMedia.length === 4) {
        return (
          <div className="d-flex flex-column gap-1" style={{ height: boxSize * 2 }}>
            {/* First row - single image */}
            <div className="position-relative" style={{ height: boxSize, width: "100%" }}>
              {filteredMedia[0].type === "video" ? (
                  <div className="position-relative w-100 h-100">
                      <img src={filteredMedia[0].thumbnail} alt="Video thumbnail" className="w-100 h-100"
                        style={{ objectFit: "cover", objectPosition: "center" }}
                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                      <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                  </div>
              ) : (
                  <img src={filteredMedia[0].url} alt="facebook-img" className="w-100 h-100"
                    style={{ objectFit: "cover", objectPosition: "center" }}
                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
              )}
            </div>

            {/* Second row - three images side by side */}
            <div className="row g-1" style={{ height: boxSize }}>
              {filteredMedia.slice(1, 4).map((m) => (
                <div key={m.id} className="col-4 position-relative" style={{ height: "100%" }}>
                  {m.type === "video" ? (
                    <div className="position-relative w-100 h-100">
                      <img src={m.thumbnail} alt="Video thumbnail" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                      <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                    </div>
                  ) : (
                    <img src={m.url} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                      onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
  
      // 5+ media → First column: 2 square images, Second column: 3 stacked images
      return (
        <div className="row g-1">
          {/* First column - 2 square images */}
          <div className="col-6 d-flex flex-column gap-1">
            {filteredMedia.slice(0, 2).map((m) => (
              <div key={m.id} className="ratio ratio-1x1 position-relative">
                {m.type === "video" ? (
                  <div className="position-relative w-100 h-100">
                    <img src={m.thumbnail} alt="Video thumbnail" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                      onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                    <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                  </div>
                ) : (
                  <img src={m.url} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                )}
              </div>
            ))}
          </div>

          {/* Second column - 3 stacked images */}
          <div className="col-6 d-flex flex-column gap-1">
            {filteredMedia.slice(2, 5).map((m, idx) => (
              <div key={m.id} className="flex-fill position-relative" style={{ minHeight: 0 }}>
                {m.type === "video" ? (
                  <div className="position-relative w-100 h-100">
                    <img src={m.thumbnail} alt="Video thumbnail" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                    <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                  </div>
                ) : (
                  <img src={m.url} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                )}

                {/* Show +X overlay on the last item if more than 5 */}
                {idx === 2 && filteredMedia.length > 5 && (
                  <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "white", fontSize: "2rem", fontWeight: "bold", }} >
                      +{filteredMedia.length - 5}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
  
    }
    return null;
  };

  const renderFacebookPreview = () => (
    <div className="preview-container-postlist facebook">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginRight: 10 }}>
          <img src={post.postPagePicture || `${process.env.PUBLIC_URL}/assets/images/avtar/user.png`} alt="Page"
            style={{ width: 36, height: 36, borderRadius: '50%', marginRight: 10 }}
            onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}
          />
          <div title={platform} style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '25px', height: '25px',
              borderRadius: '50%', background: getPlatformColor(platform), display: 'flex', alignItems: 'center',
              justifyContent: 'center', boxShadow: '0 0 2px rgba(0,0,0,0.3)', padding:'5px' }} >
            {platformSVGs[platform] || (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe h-6 w-6 text-white" >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            )}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 600 }}>{post.postPageName}</div>
          {/* <div style={{ fontSize: 12, color: '#65676b' }}>
              Sponsored <span style={{ fontSize: 10 }}>·</span> <i className="fas fa-globe"></i>
          </div> */}
        </div>
        <div style={{ marginLeft: 'auto', cursor: 'pointer', borderRadius: '50%', padding: 4, backgroundColor: '#f0f2f5' }} >
          {/* <Link to={{ pathname: '/edit-post', search: `?asset_id=${post.postPageID}&ref=${post.postID}` }} onClick={(e) => e.stopPropagation()}>
            <i className="fas fa-pencil mx-1"></i>
          </Link> */}
          <span onClick={() => {handleEdit(post.form_id)} } >
            <i className="fas fa-pencil mx-1"></i>
          </span>
        </div>
      </div>
      <div className="post-content">
        <div style={{ fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
          {post?.content?.split(/\n+/).filter(line => line.trim() !== "").map((line, lineIndex) => (
              <p key={`line-${lineIndex}`} style={{ margin: "0 0 8px 0" }}>
                {line.split(/(#\w+)/g).map((part, partIndex) =>
                  part.startsWith("#") && part.length > 1 ? (
                    <span key={`tag-${lineIndex}-${partIndex}`} className="text-primary" style={{ fontWeight: 500 }} >
                      {part}
                    </span>
                  ) : (
                    <span key={`text-${lineIndex}-${partIndex}`}>{part}</span>
                  )
                )}
              </p>
            ))}
        </div>
      </div>
      {/* {(() => {
        try {
          if (typeof post.postMedia === 'string') {
            if (post.postMedia.startsWith('https://')) {
              return <img src={post.postMedia} alt="Post Media" className="post-image" 
                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
            } else {
              const parsed = JSON.parse(post.postMedia);
              const imageUrl = parsed?.img_path;
              if (imageUrl) {
                return <img src={`${BACKEND_URL}/uploads/posts/${imageUrl}`} alt="Post Media" className="post-image" 
                          onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}/>;
              }
            }
          }
        } catch (err) {
          console.log("Post image rendering error: ",err);
        }
        return <img src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="Default" className="post-image" 
                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}/>;
      })()} */}
      {(() => {
          try {
              if (typeof post.postMedia === 'string') {
                  if (post.postMedia.startsWith('https://')) {
                      return <img src={post.postMedia} alt="Post Media" className="post-image" 
                              onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                  } else {
                      return renderMediaPreview(post.platform, post.postMedia);
                  }
              }
          } catch (err) {
              console.log("Post image rendering error: ",err);
          }
          return <img src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="Default" className="post-image" 
                  onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}/>;
      })()}

      <div className="facebook-footer">
        <div className="d-flex justify-content-between align-items-center">
          <span className="likes"><i className="far fa-thumbs-up"></i> Likes</span>
          <span className="comments"><i className="far fa-comment"></i> Comments</span>
          <span className="shares"><i className="far fa-share-square"></i> Shares</span>
        </div>
      </div>
    </div>
  );

  const renderInstagramPreview = () => (
    <div className="preview-container-postlist instagram">
      <div className="insta-header" style={{ display: 'flex', alignItems: 'center' }}>
          <div>
            <div style={{ position: 'relative', display: 'inline-block', marginRight: 10 }}>
              <img src={post.postPagePicture || `${process.env.PUBLIC_URL}/assets/images/avtar/user.png`} alt="Profile"
                  style={{ width: 36, height: 36, borderRadius: '50%', marginRight: 10 }}
                  onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}
              />
              <div title={platform} style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '25px', height: '25px', 
                  borderRadius: '50%', background: getPlatformColor(platform), display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 2px rgba(0,0,0,0.3)', padding: '5px'}} >
                {platformSVGs[platform] || (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe h-6 w-6 text-white" >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                  </svg>
                )}
              </div>
            </div>
            <span><strong>{post.postPageName}</strong></span>
          </div>
          <div style={{ marginLeft: 'auto', cursor: 'pointer', borderRadius: '50%', padding: 4, backgroundColor: '#f0f2f5' }} >
            <span onClick={() => {handleEdit(post.form_id)} } >
              <i className="fas fa-pencil mx-1"></i>
            </span>
          </div>
      </div>
      {(() => {
        try {
          if (typeof post.postMedia === 'string') {
            if (post.postMedia.startsWith('https://')) {
              return <img src={post.postMedia} alt="Post Media" className="post-image" 
                      onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
            } else {
              return renderMediaPreview(post.platform, post.postMedia);
            }
          }
        } catch (err) {
          console.log("Post image rendering error: ",err);
        }
        return <img src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="Default" className="post-image" 
                onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}/>;
      })()}
      <div className="post-content">
        <div style={{ fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
          {post?.content?.split(/\n+/) .filter(line => line.trim() !== "").map((line, lineIndex) => (
              <p key={`line-${lineIndex}`} style={{ margin: "0 0 8px 0" }}>
                {line.split(/(#\w+)/g).map((part, partIndex) =>
                  part.startsWith("#") && part.length > 1 ? (
                    <span key={`tag-${lineIndex}-${partIndex}`} className="text-primary" style={{ fontWeight: 500 }} >
                      {part}
                    </span>
                  ) : (
                    <span key={`text-${lineIndex}-${partIndex}`}>{part}</span>
                  )
                )}
              </p>
            ))}
        </div>
      </div>
      <div className="insta-footer">
        <div className="d-flex justify-content-between align-items-center">
          <span className="likes">❤️ Likes</span>
          <span className="comments"><i className="far fa-comment"></i> Comments</span>
          <span className="shares"><i className="far fa-share-square"></i> Shares</span>
        </div>
      </div>
    </div>
  );

  const renderLinkedInPreview = () => (
    <div className="preview-container-postlist linkedin">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginRight: 10 }}>
          <img src={post.postPagePicture || `${process.env.PUBLIC_URL}/assets/images/avtar/user.png`} alt="Page"
            style={{ width: 36, height: 36, borderRadius: '50%', marginRight: 10 }}
            onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}
          />
          <div title={platform} style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '25px', height: '25px', borderRadius: '50%',
              background: getPlatformColor(platform), display: 'flex', alignItems: 'center', justifyContent: 'center', 
              boxShadow: '0 0 2px rgba(0,0,0,0.3)', padding: "5px" }} >
            {platformSVGs[platform] || (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe h-6 w-6 text-white" >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            )}
          </div>
        </div>
        <div>
            <div style={{ fontWeight: 600 }}>{post.postPageName}</div>
            {/* <div style={{ fontSize: 12, color: '#65676b' }}>
                Sponsored <span style={{ fontSize: 10 }}>·</span> <i className="fas fa-globe"></i>
            </div> */}
        </div>
        <div style={{ marginLeft: 'auto', cursor: 'pointer', borderRadius: '50%', padding: 4, backgroundColor: '#f0f2f5' }} >
          <span onClick={() => {handleEdit(post.form_id)} } >
            <i className="fas fa-pencil mx-1"></i>
          </span>
        </div>
      </div>
      <div className="post-content">
        <div style={{ fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
          {post?.content?.split(/\n+/).filter(line => line.trim() !== "").map((line, lineIndex) => (
              <p key={`line-${lineIndex}`} style={{ margin: "0 0 8px 0" }}>
                {line.split(/(#\w+)/g).map((part, partIndex) =>
                  part.startsWith("#") && part.length > 1 ? (
                    <span key={`tag-${lineIndex}-${partIndex}`} className="text-primary" style={{ fontWeight: 500 }} >
                      {part}
                    </span>
                  ) : (
                    <span key={`text-${lineIndex}-${partIndex}`}>{part}</span>
                  )
                )}
              </p>
            ))}
        </div>
      </div>
      {(() => {
        try {
          if (typeof post.postMedia === 'string') {
            if (post.postMedia.startsWith('https://')) {
              return <img src={post.postMedia} alt="Post Media" className="post-image" 
                      onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
            } else {
              return renderMediaPreview(post.platform, post.postMedia);
            }
          }
        } catch (err) {
          console.log("Post image rendering error: ",err);
        }
        return <img src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="Default" className="post-image" 
                onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}/>;
      })()}
      <div className="linkedin-footer">
        <div className="d-flex justify-content-between align-items-center">
          <span className="likes"><i className="far fa-thumbs-up"></i> Likes</span>
          <span className="comments"><i className="far fa-comment"></i> Comments</span>
          <span className="repost"><i className="fas fa-share-square"></i> Reposts</span>
          <span className="send"><i className="fas fa-paper-plane"></i> Shares</span>
        </div>
      </div>
    </div>
  );

  const renderPreview = () => {
    switch (platform?.toLowerCase()) {
      case 'facebook': return renderFacebookPreview();
      case 'instagram': return renderInstagramPreview();
      case 'linkedin': return renderLinkedInPreview();
      default: return (
        <div className="preview-container-postlist default">
          <p>Preview not available for this platform.</p>
        </div>
      );
    }
  };

  return (
    <div className="post-preview-wrapper scrollable-preview">
      {renderPreview()}
    </div>
  );
};

export default PostPreviewRenderer;
