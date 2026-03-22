-- Script SQL para criar as tabelas no Supabase para o sistema de Avaliação 360°
-- Execute este script no SQL Editor do Supabase

-- Trocando comentário "assessores/vendedores" por "gestores_de_contas"
-- Tabela para armazenar os gestores de contas
CREATE TABLE IF NOT EXISTS gestores_de_contas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar os períodos de avaliação
CREATE TABLE IF NOT EXISTS periodos_avaliacao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    data_inicio DATE,
    data_fim DATE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar as categorias/pilares
CREATE TABLE IF NOT EXISTS categorias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    icone VARCHAR(10),
    ordem INTEGER,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar as perguntas de cada categoria
CREATE TABLE IF NOT EXISTS perguntas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    categoria_id UUID REFERENCES categorias(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    ordem INTEGER,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela principal para armazenar as avaliações
CREATE TABLE IF NOT EXISTS avaliacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Trocando "assessor_id" por "gestor_de_contas_id"
    gestor_de_contas_id UUID REFERENCES gestores_de_contas(id) ON DELETE CASCADE,
    periodo_id UUID REFERENCES periodos_avaliacao(id) ON DELETE CASCADE,
    tipo_avaliacao VARCHAR(20) NOT NULL CHECK (tipo_avaliacao IN ('self', 'third-party')),
    avaliador_nome VARCHAR(255), -- Nome do gestor que fez a avaliação (para third-party)
    data_avaliacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar as respostas individuais
CREATE TABLE IF NOT EXISTS respostas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    avaliacao_id UUID REFERENCES avaliacoes(id) ON DELETE CASCADE,
    pergunta_id UUID REFERENCES perguntas(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES categorias(id) ON DELETE CASCADE,
    valor INTEGER NOT NULL CHECK (valor >= 1 AND valor <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trocando comentário "dados iniciais dos assessores" por "dados iniciais dos gestores de contas"
-- Inserir dados iniciais dos gestores de contas
INSERT INTO gestores_de_contas (nome) VALUES 
    ('Altevir Ferezin'),
    ('Diane Pimentel'),
    ('Juliana Viana'),
    ('Paula Nogueira'),
    ('Renágela Araújo')
ON CONFLICT DO NOTHING;

-- Inserir categorias/pilares
INSERT INTO categorias (nome, icone, ordem) VALUES 
    ('Visão de Negócios', '📊', 1),
    ('Conhecimento de Vendas', '📅', 2),
    ('Relacionamento Interpessoal', '🤝🏻', 3),
    ('Autogestão', '🧭', 4)
ON CONFLICT DO NOTHING;

-- Inserir perguntas exemplo para cada categoria
WITH categoria_ids AS (
    SELECT id, nome FROM categorias
)
INSERT INTO perguntas (categoria_id, texto, ordem)
SELECT 
    c.id,
    CASE 
        WHEN c.nome = 'Visão de Negócios' THEN 'Demonstra compreensão clara dos objetivos estratégicos da empresa'
        WHEN c.nome = 'Conhecimento de Vendas' THEN 'Possui conhecimento técnico adequado sobre produtos e serviços'
        WHEN c.nome = 'Relacionamento Interpessoal' THEN 'Mantém relacionamentos positivos com clientes e colegas'
        WHEN c.nome = 'Autogestão' THEN 'Gerencia efetivamente seu tempo e prioridades'
    END,
    1
FROM categoria_ids c
ON CONFLICT DO NOTHING;

-- Criar índices para melhor performance
-- Trocando "assessor_periodo" por "gestor_periodo"
CREATE INDEX IF NOT EXISTS idx_avaliacoes_gestor_periodo ON avaliacoes(gestor_de_contas_id, periodo_id);
CREATE INDEX IF NOT EXISTS idx_respostas_avaliacao ON respostas(avaliacao_id);
CREATE INDEX IF NOT EXISTS idx_respostas_categoria ON respostas(categoria_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_tipo ON avaliacoes(tipo_avaliacao);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_ativo ON avaliacoes(ativo);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar updated_at
-- Trocando "assessores" por "gestores_de_contas"
CREATE TRIGGER update_gestores_de_contas_updated_at BEFORE UPDATE ON gestores_de_contas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_periodos_updated_at BEFORE UPDATE ON periodos_avaliacao FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_avaliacoes_updated_at BEFORE UPDATE ON avaliacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security) para segurança
-- Trocando "assessores" por "gestores_de_contas"
ALTER TABLE gestores_de_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodos_avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE perguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS básicas (permitir acesso público por enquanto)
-- Trocando "assessores" por "gestores de contas"
CREATE POLICY "Permitir acesso público aos gestores de contas" ON gestores_de_contas FOR ALL USING (true);
CREATE POLICY "Permitir acesso público aos períodos" ON periodos_avaliacao FOR ALL USING (true);
CREATE POLICY "Permitir acesso público às categorias" ON categorias FOR ALL USING (true);
CREATE POLICY "Permitir acesso público às perguntas" ON perguntas FOR ALL USING (true);
CREATE POLICY "Permitir acesso público às avaliações" ON avaliacoes FOR ALL USING (true);
CREATE POLICY "Permitir acesso público às respostas" ON respostas FOR ALL USING (true);

-- View para facilitar consultas consolidadas
CREATE OR REPLACE VIEW vw_avaliacoes_consolidadas AS
SELECT 
    a.id as avaliacao_id,
    -- Trocando "assessor_nome" por "gestor_de_contas_nome"
    gdc.nome as gestor_de_contas_nome,
    p.nome as periodo_nome,
    a.tipo_avaliacao,
    a.avaliador_nome,
    a.data_avaliacao,
    c.nome as categoria_nome,
    c.icone as categoria_icone,
    r.valor as resposta_valor,
    per.texto as pergunta_texto
FROM avaliacoes a
-- Trocando join com "assessores" por "gestores_de_contas"
JOIN gestores_de_contas gdc ON a.gestor_de_contas_id = gdc.id
JOIN periodos_avaliacao p ON a.periodo_id = p.id
JOIN respostas r ON a.id = r.avaliacao_id
JOIN categorias c ON r.categoria_id = c.id
JOIN perguntas per ON r.pergunta_id = per.id
WHERE a.ativo = true
ORDER BY a.data_avaliacao DESC, gdc.nome, c.ordem;

-- View para médias por categoria
CREATE OR REPLACE VIEW vw_medias_por_categoria AS
SELECT 
    -- Trocando "assessor_nome" por "gestor_de_contas_nome"
    gdc.nome as gestor_de_contas_nome,
    p.nome as periodo_nome,
    c.nome as categoria_nome,
    a.tipo_avaliacao,
    AVG(r.valor::numeric) as media_categoria,
    COUNT(r.valor) as total_respostas
FROM avaliacoes a
-- Trocando join com "assessores" por "gestores_de_contas"
JOIN gestores_de_contas gdc ON a.gestor_de_contas_id = gdc.id
JOIN periodos_avaliacao p ON a.periodo_id = p.id
JOIN respostas r ON a.id = r.avaliacao_id
JOIN categorias c ON r.categoria_id = c.id
WHERE a.ativo = true
GROUP BY gdc.nome, p.nome, c.nome, a.tipo_avaliacao, c.ordem
ORDER BY gdc.nome, p.nome, c.ordem;
