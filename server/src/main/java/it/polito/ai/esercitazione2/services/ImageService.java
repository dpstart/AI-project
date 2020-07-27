package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.entities.Image;

import java.io.IOException;

public interface ImageService {

    Image getImage(Long imageName);

    Image save(Image img) throws IOException;

    void remove(Long imageName);
}
