import streamlit as st
from PIL import Image, ImageOps
import io
import os

# Page Config
st.set_page_config(
    page_title="Local TinyUI - Image Compressor",
    page_icon="🖼️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for aesthetics
st.markdown("""
<style>
    .stApp {
        background-color: #f8f9fa;
    }
    .css-1d391kg {
        padding-top: 1rem;
    }
    .stButton>button {
        width: 100%;
        border-radius: 8px;
    }
    /* Metric Card Styling */
    div[data-testid="stMetric"] {
        background-color: #ffffff;
        border: 1px solid #e0e0e0;
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
</style>
""", unsafe_allow_html=True)

def compress_image(image, format, quality, resize_factor):
    """
    Compresses an image based on the given parameters.
    Returns: 
        compressed_buffer: BytesIO object of the compressed image
        original_size: size in bytes
        compressed_size: size in bytes
    """
    # 1. Check orientation
    image = ImageOps.exif_transpose(image)
    
    # Original Size
    original_buffer = io.BytesIO()
    # We might not need to save the original to get size if we use file.size, 
    # but for consistency with processed image let's see. 
    # Actually st.file_uploader file object has .size attribute (in bytes).
    # We will pass the file object for original size or just calculate it here if passed as Image.
    # To be safe and minimal, let's rely on the calling function to provide original size 
    # OR we re-save to a buffer to strictly compare 'image data'. 
    # But re-saving original is wasteful. 
    # Let's assume input 'image' is a PIL Image object.
    
    # 2. Resize
    if resize_factor < 100:
        width, height = image.size
        new_width = int(width * (resize_factor / 100))
        new_height = int(height * (resize_factor / 100))
        image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # 3. Buffer setup
    compressed_buffer = io.BytesIO()
    
    # 4. Save with compression
    # Handle RGBA to RGB conversion for JPEG
    if format.upper() == 'JPEG' and image.mode in ('RGBA', 'P'):
        image = image.convert('RGB')
        
    image.save(compressed_buffer, format=format, quality=quality, optimize=True)
    
    return compressed_buffer

def main():
    st.title("Local TinyUI 🖼️")
    st.markdown("### Privacy-first, local image compression tool.")

    # --- Sidebar Settings ---
    st.sidebar.header("Settings")
    
    # Format Selector
    format_option = st.sidebar.selectbox(
        "Output Format",
        options=["WEBP", "JPEG", "PNG"],
        index=0, # Default to WEBP
        help="WebP offers the best compression."
    )
    
    # Quality Slider
    quality = st.sidebar.slider(
        "Quality",
        min_value=1,
        max_value=100,
        value=80,
        help="Higher quality = larger file size."
    )
    
    # Resize Option
    resize_factor = st.sidebar.slider(
        "Resize (%)",
        min_value=10,
        max_value=100,
        value=100,
        help="Reduce resolution to save more space."
    )

    # --- Main Area ---
    uploaded_files = st.file_uploader(
        "Upload images", 
        type=['png', 'jpg', 'jpeg', 'webp'], 
        accept_multiple_files=True
    )

    if uploaded_files:
        st.divider()
        st.subheader("Results")
        
        # Grid Layout
        cols = st.columns(3) # Creates specific number of columns, wrapping might need manual logic or just list
        
        for i, uploaded_file in enumerate(uploaded_files):
            # Process each file
            try:
                # Open Image
                img = Image.open(uploaded_file)
                original_size = uploaded_file.size
                
                # Compress
                compressed_buf = compress_image(img, format_option, quality, resize_factor)
                compressed_size = len(compressed_buf.getvalue())
                
                # Calculate Savings
                savings = (1 - (compressed_size / original_size)) * 100
                
                # Display
                col = cols[i % 3] # simple grid logic
                with col:
                    st.image(img, caption=uploaded_file.name, use_container_width=True)
                    
                    # Metrics
                    m_col1, m_col2 = st.columns(2)
                    m_col1.metric("Original", f"{original_size/1024:.1f} KB")
                    m_col2.metric("Compressed", f"{compressed_size/1024:.1f} KB", f"-{savings:.1f}%")
                    
                    # Download Button
                    st.download_button(
                        label="Download",
                        data=compressed_buf.getvalue(),
                        file_name=f"compressed_{os.path.splitext(uploaded_file.name)[0]}.{format_option.lower()}",
                        mime=f"image/{format_option.lower()}",
                        key=f"dl_{i}"
                    )
                    st.divider()

            except Exception as e:
                st.error(f"Error processing {uploaded_file.name}: {e}")

if __name__ == "__main__":
    main()
