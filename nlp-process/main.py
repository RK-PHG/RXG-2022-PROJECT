import pandas as pd
import yake
text = open("test.txt", encoding='UTF-8').read()
text = text.lower()
for i in '!"“”#$%&()*+,./:;<=>?@[\]^_‘{|}~':
    txt = text.replace(i, " ")
kw_extractor = yake.KeywordExtractor()
language = "en"
max_ngram_size = 4  # 最大关键词语长度
deduplication_threshold = 0.9  # 设置在关键词中是否可以重复单词
numOfKeywords = 1000
custom_kw_extractor = yake.KeywordExtractor(lan=language, n=max_ngram_size, dedupLim=deduplication_threshold, top=numOfKeywords, features=None)
keywords = custom_kw_extractor.extract_keywords(text)

pd.DataFrame(keywords).to_csv("test4-1000.csv")