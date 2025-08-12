-- Enhanced Analytics Tables for Question Analysis and Product Insights

-- Table for tracking question categories
CREATE TABLE question_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    keywords TEXT[], -- Array of keywords to match
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table for tracking analyzed questions
CREATE TABLE analyzed_questions (
    id SERIAL PRIMARY KEY,
    message_id INT REFERENCES messages(id) ON DELETE CASCADE,
    normalized_question TEXT NOT NULL,
    category_id INT REFERENCES question_categories(id) ON DELETE SET NULL,
    sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
    complexity_score INT, -- 1-5 scale
    is_product_related BOOLEAN DEFAULT FALSE,
    extracted_products TEXT[], -- Array of product names mentioned
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(message_id)
);

-- Table for tracking product mentions and requests
CREATE TABLE product_mentions (
    id SERIAL PRIMARY KEY,
    message_id INT REFERENCES messages(id) ON DELETE CASCADE,
    chatbot_id INT REFERENCES chatbots(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    mention_type VARCHAR(50) NOT NULL, -- 'inquiry', 'complaint', 'praise', 'feature_request'
    context TEXT, -- Context around the mention
    sentiment_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table for aggregated analytics
CREATE TABLE analytics_summary (
    id SERIAL PRIMARY KEY,
    chatbot_id INT REFERENCES chatbots(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_questions INT DEFAULT 0,
    total_product_mentions INT DEFAULT 0,
    avg_sentiment DECIMAL(3,2),
    top_questions JSONB, -- Top questions with counts
    top_products JSONB, -- Top products with counts
    category_breakdown JSONB, -- Question categories with counts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(chatbot_id, period_start, period_end)
);

-- Insert default question categories
INSERT INTO question_categories (name, description, keywords) VALUES
('Product Inquiry', 'Questions about specific products or services', ARRAY['product', 'item', 'service', 'buy', 'purchase', 'price', 'cost', 'available', 'stock']),
('Support Request', 'Technical support and help requests', ARRAY['help', 'support', 'problem', 'issue', 'error', 'bug', 'not working', 'broken']),
('Pricing Information', 'Questions about pricing and costs', ARRAY['price', 'cost', 'expensive', 'cheap', 'discount', 'deal', 'offer', 'promotion']),
('Feature Request', 'Requests for new features or improvements', ARRAY['feature', 'improve', 'add', 'wish', 'would like', 'suggestion', 'enhancement']),
('Shipping Information', 'Questions about shipping and delivery', ARRAY['shipping', 'delivery', 'ship', 'arrive', 'tracking', 'when', 'fast']),
('General Information', 'General inquiries about the company or service', ARRAY['about', 'company', 'who', 'what is', 'how does', 'information']),
('Comparison', 'Product or service comparisons', ARRAY['compare', 'vs', 'versus', 'difference', 'better', 'best', 'alternative']),
('Complaint', 'Customer complaints and issues', ARRAY['complain', 'unhappy', 'disappointed', 'bad', 'terrible', 'awful', 'worst']);

-- Function to analyze and categorize a question
CREATE OR REPLACE FUNCTION analyze_question(
    question_text TEXT,
    msg_id INT,
    bot_id INT
) RETURNS VOID AS $$
DECLARE
    normalized_q TEXT;
    category_record RECORD;
    matched_category_id INT := NULL;
    products TEXT[];
    product_keywords TEXT[] := ARRAY['product', 'item', 'laptop', 'phone', 'computer', 'software', 'app', 'service'];
    keyword TEXT;
    sentiment DECIMAL(3,2) := 0.0;
    complexity INT := 1;
BEGIN
    -- Normalize the question
    normalized_q := LOWER(TRIM(question_text));
    normalized_q := REGEXP_REPLACE(normalized_q, '[^a-zA-Z0-9\s]', '', 'g');
    
    -- Find matching category
    FOR category_record IN 
        SELECT id, keywords FROM question_categories
    LOOP
        FOR i IN 1..array_length(category_record.keywords, 1)
        LOOP
            IF normalized_q ILIKE '%' || category_record.keywords[i] || '%' THEN
                matched_category_id := category_record.id;
                EXIT;
            END IF;
        END LOOP;
        EXIT WHEN matched_category_id IS NOT NULL;
    END LOOP;
    
    -- Extract potential product mentions
    products := ARRAY[]::TEXT[];
    FOREACH keyword IN ARRAY product_keywords
    LOOP
        IF normalized_q ILIKE '%' || keyword || '%' THEN
            products := array_append(products, keyword);
        END IF;
    END LOOP;
    
    -- Calculate basic sentiment (simplified)
    IF normalized_q ILIKE ANY(ARRAY['%good%', '%great%', '%excellent%', '%love%', '%amazing%']) THEN
        sentiment := 0.8;
    ELSIF normalized_q ILIKE ANY(ARRAY['%bad%', '%terrible%', '%awful%', '%hate%', '%worst%']) THEN
        sentiment := -0.8;
    ELSIF normalized_q ILIKE ANY(ARRAY['%problem%', '%issue%', '%broken%', '%not working%']) THEN
        sentiment := -0.4;
    ELSE
        sentiment := 0.0;
    END IF;
    
    -- Calculate complexity based on question length and structure
    complexity := LEAST(5, GREATEST(1, LENGTH(question_text) / 20));
    
    -- Insert analyzed question
    INSERT INTO analyzed_questions (
        message_id,
        normalized_question,
        category_id,
        sentiment_score,
        complexity_score,
        is_product_related,
        extracted_products
    ) VALUES (
        msg_id,
        normalized_q,
        matched_category_id,
        sentiment,
        complexity,
        array_length(products, 1) > 0,
        products
    ) ON CONFLICT (message_id) DO UPDATE SET
        normalized_question = EXCLUDED.normalized_question,
        category_id = EXCLUDED.category_id,
        sentiment_score = EXCLUDED.sentiment_score,
        complexity_score = EXCLUDED.complexity_score,
        is_product_related = EXCLUDED.is_product_related,
        extracted_products = EXCLUDED.extracted_products;
    
    -- Insert product mentions
    IF array_length(products, 1) > 0 THEN
        FOREACH keyword IN ARRAY products
        LOOP
            INSERT INTO product_mentions (
                message_id,
                chatbot_id,
                product_name,
                mention_type,
                context,
                sentiment_score
            ) VALUES (
                msg_id,
                bot_id,
                keyword,
                CASE 
                    WHEN sentiment < -0.5 THEN 'complaint'
                    WHEN sentiment > 0.5 THEN 'praise'
                    WHEN normalized_q ILIKE '%buy%' OR normalized_q ILIKE '%purchase%' THEN 'inquiry'
                    ELSE 'inquiry'
                END,
                question_text,
                sentiment
            ) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update analytics summary
CREATE OR REPLACE FUNCTION update_analytics_summary(
    bot_id INT,
    start_date DATE,
    end_date DATE
) RETURNS VOID AS $$
DECLARE
    total_q INT;
    total_p INT;
    avg_sent DECIMAL(3,2);
    top_q JSONB;
    top_p JSONB;
    cat_breakdown JSONB;
BEGIN
    -- Calculate totals
    SELECT COUNT(*) INTO total_q
    FROM analyzed_questions aq
    JOIN messages m ON aq.message_id = m.id
    JOIN chat_sessions cs ON m.chat_session_id = cs.id
    WHERE cs.chatbot_id = bot_id 
    AND m.created_at::date BETWEEN start_date AND end_date;
    
    SELECT COUNT(*) INTO total_p
    FROM product_mentions pm
    WHERE pm.chatbot_id = bot_id 
    AND pm.created_at::date BETWEEN start_date AND end_date;
    
    SELECT AVG(sentiment_score) INTO avg_sent
    FROM analyzed_questions aq
    JOIN messages m ON aq.message_id = m.id
    JOIN chat_sessions cs ON m.chat_session_id = cs.id
    WHERE cs.chatbot_id = bot_id 
    AND m.created_at::date BETWEEN start_date AND end_date;
    
    -- Get top questions
    SELECT json_agg(row_to_json(t)) INTO top_q
    FROM (
        SELECT normalized_question, COUNT(*) as count
        FROM analyzed_questions aq
        JOIN messages m ON aq.message_id = m.id
        JOIN chat_sessions cs ON m.chat_session_id = cs.id
        WHERE cs.chatbot_id = bot_id 
        AND m.created_at::date BETWEEN start_date AND end_date
        GROUP BY normalized_question
        ORDER BY count DESC
        LIMIT 10
    ) t;
    
    -- Get top products
    SELECT json_agg(row_to_json(t)) INTO top_p
    FROM (
        SELECT product_name, COUNT(*) as count
        FROM product_mentions pm
        WHERE pm.chatbot_id = bot_id 
        AND pm.created_at::date BETWEEN start_date AND end_date
        GROUP BY product_name
        ORDER BY count DESC
        LIMIT 10
    ) t;
    
    -- Get category breakdown
    SELECT json_agg(row_to_json(t)) INTO cat_breakdown
    FROM (
        SELECT qc.name, COUNT(*) as count
        FROM analyzed_questions aq
        JOIN question_categories qc ON aq.category_id = qc.id
        JOIN messages m ON aq.message_id = m.id
        JOIN chat_sessions cs ON m.chat_session_id = cs.id
        WHERE cs.chatbot_id = bot_id 
        AND m.created_at::date BETWEEN start_date AND end_date
        GROUP BY qc.name
        ORDER BY count DESC
    ) t;
    
    -- Insert or update summary
    INSERT INTO analytics_summary (
        chatbot_id,
        period_start,
        period_end,
        total_questions,
        total_product_mentions,
        avg_sentiment,
        top_questions,
        top_products,
        category_breakdown
    ) VALUES (
        bot_id,
        start_date,
        end_date,
        total_q,
        total_p,
        avg_sent,
        top_q,
        top_p,
        cat_breakdown
    ) ON CONFLICT (chatbot_id, period_start, period_end) DO UPDATE SET
        total_questions = EXCLUDED.total_questions,
        total_product_mentions = EXCLUDED.total_product_mentions,
        avg_sentiment = EXCLUDED.avg_sentiment,
        top_questions = EXCLUDED.top_questions,
        top_products = EXCLUDED.top_products,
        category_breakdown = EXCLUDED.category_breakdown;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically analyze questions when messages are inserted
CREATE OR REPLACE FUNCTION trigger_analyze_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Only analyze user/guest messages
    IF NEW.sender = 'user' OR NEW.sender = 'guest' THEN
        -- Get chatbot_id from chat_session
        DECLARE
            bot_id INT;
        BEGIN
            SELECT chatbot_id INTO bot_id
            FROM chat_sessions
            WHERE id = NEW.chat_session_id;
            
            -- Analyze the question
            PERFORM analyze_question(NEW.content, NEW.id, bot_id);
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analyze_message_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION trigger_analyze_message();
